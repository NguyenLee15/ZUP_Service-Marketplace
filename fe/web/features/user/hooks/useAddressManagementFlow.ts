'use client';

import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { userApi } from '@/features/user/services/user.api';
import {
  getProvinceOptions,
  getWardOptions,
  NEW_ADMIN_DISTRICT_VALUE,
  withCurrentOption,
} from '@/lib/address-options';
import { useAddressOptions } from '@/hooks/use-address-options';

export const addressSchema = z.object({
  label: z.string().max(50, 'Nhãn địa chỉ tối đa 50 ký tự').optional(),
  province: z.string().min(1, 'Vui lòng chọn tỉnh/thành phố'),
  district: z.string().min(1, 'Thông tin địa giới không hợp lệ'),
  ward: z.string().min(1, 'Vui lòng chọn phường/xã/đặc khu'),
  addressDetail: z.string().min(5, 'Địa chỉ phải có ít nhất 5 ký tự'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isDefault: z.boolean().default(false),
});

export type AddressFormData = z.infer<typeof addressSchema>;

export interface Address {
  id: number;
  label?: string | null;
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
}

export const emptyAddressValues: AddressFormData = {
  label: '',
  province: '',
  district: NEW_ADMIN_DISTRICT_VALUE,
  ward: '',
  addressDetail: '',
  latitude: 21.028511,
  longitude: 105.804817,
  isDefault: false,
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
      error?: { message?: string };
    };
  };
};

function getApiMessage(error: unknown, fallback: string) {
  const apiError = error as ApiError;
  return (
    apiError.response?.data?.message ||
    apiError.response?.data?.error?.message ||
    fallback
  );
}

function normalizeAddresses(payload: unknown): Address[] {
  const response = payload as { data?: { data?: unknown } };
  const data = response.data?.data;
  return Array.isArray(data) ? (data as Address[]) : [];
}

export function useAddressManagementFlow() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const {
    addressOptions,
    loading: addressOptionsLoading,
    fallback: addressOptionsFallback,
  } = useAddressOptions();

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    mode: 'onChange',
    defaultValues: emptyAddressValues,
  });

  const selectedProvince = form.watch('province') || '';
  const selectedWard = form.watch('ward') || '';
  const provinceOptions = withCurrentOption(
    getProvinceOptions(addressOptions),
    selectedProvince,
  );
  const wardOptions = withCurrentOption(
    getWardOptions(selectedProvince, addressOptions),
    selectedWard,
  );
  const provinceField = form.register('province');
  const wardField = form.register('ward');

  const handleProvinceSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    void provinceField.onChange(event);
    form.setValue('district', NEW_ADMIN_DISTRICT_VALUE, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue('ward', '', { shouldDirty: true, shouldValidate: true });
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage('');
    window.setTimeout(() => setSuccessMessage(''), 3500);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage('');
    window.setTimeout(() => setErrorMessage(''), 5000);
  };

  const loadAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await userApi.getAddresses();
      setAddresses(normalizeAddresses(response));
    } catch (error) {
      setAddresses([]);
      showError(
        getApiMessage(
          error,
          'Không thể tải danh sách địa chỉ. Vui lòng thử lại.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  const closeModal = () => {
    setShowModal(false);
    form.reset(emptyAddressValues);
  };

  const onSubmit = async (data: AddressFormData) => {
    try {
      await userApi.createAddress({
        label: data.label?.trim() || undefined,
        province: data.province,
        district: data.district || NEW_ADMIN_DISTRICT_VALUE,
        ward: data.ward,
        addressDetail: data.addressDetail,
        latitude: data.latitude || 21.028511,
        longitude: data.longitude || 105.804817,
        isDefault: data.isDefault,
      });

      closeModal();
      await loadAddresses();
      showSuccess('Thêm địa chỉ thành công');
    } catch (error) {
      showError(
        getApiMessage(error, 'Không thể thêm địa chỉ. Vui lòng thử lại.'),
      );
    }
  };

  const deleteAddress = async (id: number) => {
    try {
      setActionId(id);
      await userApi.deleteAddress(id);
      await loadAddresses();
      showSuccess('Đã xóa địa chỉ');
    } catch (error) {
      showError(
        getApiMessage(error, 'Không thể xóa địa chỉ. Vui lòng thử lại.'),
      );
    } finally {
      setActionId(null);
    }
  };

  const setDefaultAddress = async (id: number) => {
    try {
      setActionId(id);
      await userApi.setDefaultAddress(id);
      await loadAddresses();
      showSuccess('Đã đặt làm địa chỉ mặc định');
    } catch (error) {
      showError(
        getApiMessage(
          error,
          'Không thể cập nhật địa chỉ mặc định. Vui lòng thử lại.',
        ),
      );
    } finally {
      setActionId(null);
    }
  };

  return {
    addresses,
    loading,
    actionId,
    showModal,
    setShowModal,
    successMessage,
    errorMessage,
    form,
    selectedProvince,
    selectedWard,
    provinceOptions,
    wardOptions,
    addressOptionsLoading,
    addressOptionsFallback,
    provinceField,
    wardField,
    handleProvinceSelect,
    closeModal,
    onSubmit,
    deleteAddress,
    setDefaultAddress,
  };
}

