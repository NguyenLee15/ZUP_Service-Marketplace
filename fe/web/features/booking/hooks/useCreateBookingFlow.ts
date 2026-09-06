'use client';

import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { servicesApi, bookingsApi } from '@/features/auth/services/api';
import { useToast } from '@/components/ui/use-toast';
import { userApi } from '@/features/user/services/user.api';
import {
  getProvinceOptions,
  getWardOptions,
  NEW_ADMIN_DISTRICT_VALUE,
  withCurrentOption,
} from '@/lib/address-options';
import { useAddressOptions } from '@/hooks/use-address-options';

export type AddressMode = 'default' | 'custom';

export interface UserAddress {
  id: number;
  label?: string | null;
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
  isDefault: boolean;
}

export interface SelectedItem {
  serviceItemId: number;
  quantity: number;
  name: string;
  price: number;
  unit: string;
}

function normalizeAddresses(payload: unknown): UserAddress[] {
  const response = payload as { data?: { data?: unknown } };
  const data = response.data?.data;
  return Array.isArray(data) ? (data as UserAddress[]) : [];
}

export const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

export function useCreateBookingFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { addressOptions, loading: addressOptionsLoading, fallback: addressOptionsFallback } = useAddressOptions();
  const serviceId = searchParams.get('serviceId');
  const reorderId = searchParams.get('reorderId');

  const [service, setService] = useState<ApiPayload>(null);
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressMode, setAddressMode] = useState<AddressMode>('custom');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [description, setDescription] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState(NEW_ADMIN_DISTRICT_VALUE);
  const [ward, setWard] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [desiredTime, setDesiredTime] = useState('');
  const [timeMode, setTimeMode] = useState<'now' | 'scheduled'>('now');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedItems, setSelectedItems] = useState<Record<number, SelectedItem>>({});

  // Wizard steps: 1 = Hạng mục & Mô tả, 2 = Địa chỉ thực hiện, 3 = Thời gian & Xác nhận
  const [step, setStep] = useState(1);
  const [gpsLoading, setGpsLoading] = useState(false);
  const submittedRef = useRef(false);

  const [showSmartInput, setShowSmartInput] = useState(!serviceId);
  const [aiIntentResult, setAiIntentResult] = useState<ApiPayload>(null);

  const defaultAddress = addresses.find((address) => address.isDefault);
  const provinceOptions = withCurrentOption(getProvinceOptions(addressOptions), province);
  const wardOptions = withCurrentOption(getWardOptions(province, addressOptions), ward);

  const clearAddressErrors = () => {
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.province;
      delete next.ward;
      delete next.addressDetail;
      return next;
    });
  };

  const applyAddress = (address: UserAddress) => {
    setProvince(address.province);
    setDistrict(address.district);
    setWard(address.ward);
    setAddressDetail(address.addressDetail);
    setSelectedAddressId(address.id);
    clearAddressErrors();
  };

  const useCustomAddress = () => {
    setAddressMode('custom');
    setSelectedAddressId(null);
    setProvince('');
    setDistrict(NEW_ADMIN_DISTRICT_VALUE);
    setWard('');
    setAddressDetail('');
  };

  const validate = (name: string, value: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      if (name === 'description') {
        if (!value) newErrors.description = 'Vui lòng mô tả yêu cầu';
        else if (value.length < 10) newErrors.description = 'Mô tả quá ngắn (tối thiểu 10 ký tự)';
        else delete newErrors.description;
      }
      if (['province', 'ward', 'addressDetail'].includes(name)) {
        if (!value) newErrors[name] = 'Bắt buộc';
        else delete newErrors[name];
      }
      if (name === 'desiredTime') {
        const selectedDate = new Date(value);
        if (isNaN(selectedDate.getTime())) newErrors.desiredTime = 'Thời gian không hợp lệ';
        else if (selectedDate < new Date()) newErrors.desiredTime = 'Thời gian phải ở tương lai';
        else delete newErrors.desiredTime;
      }
      return newErrors;
    });
  };

  const handleProvinceChange = (value: string) => {
    setProvince(value);
    setDistrict(NEW_ADMIN_DISTRICT_VALUE);
    setWard('');
    validate('province', value);
    validate('ward', '');
  };

  const handleWardChange = (value: string) => {
    setWard(value);
    validate('ward', value);
  };

  useEffect(() => {
    if (!serviceId) return;
    servicesApi.getDetail(Number(serviceId)).then((res) => setService(res.data.data)).catch(() => router.push('/services'));

    if (reorderId) {
      bookingsApi.getById(Number(reorderId)).then((res) => {
        const old = res.data.data;
        if (old) {
          setDescription(old.description || '');
          setAddressMode('custom');
          setSelectedAddressId(null);
          setProvince(old.province || '');
          setDistrict(old.district || '');
          setWard(old.ward || '');
          setAddressDetail(old.addressDetail || '');
        }
      }).catch(console.error);
    }
  }, [serviceId, reorderId, router]);

  useEffect(() => {
    let cancelled = false;

    userApi
      .getAddresses()
      .then((response) => {
        if (cancelled) return;
        const normalized = normalizeAddresses(response);
        setAddresses(normalized);

        const preferred = normalized.find((address) => address.isDefault);
        if (!reorderId && preferred) {
          setAddressMode('default');
          applyAddress(preferred);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAddresses([]);
          setAddressMode('custom');
        }
      })
      .finally(() => {
        if (!cancelled) setAddressesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reorderId]);

  const handleAutoLocate = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Trình duyệt không hỗ trợ định vị',
        description: 'Vui lòng nhập địa chỉ thực hiện theo cách thủ công.',
        variant: 'destructive',
      });
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setAddressMode('custom');
        setSelectedAddressId(null);
        toast({
          title: 'Đã nhận được vị trí hiện tại',
          description: 'Vui lòng kiểm tra và nhập địa chỉ chi tiết để thợ đến đúng nơi.',
        });
        setGpsLoading(false);
      },
      () => {
        toast({
          title: 'Không thể lấy vị trí',
          description: 'Vui lòng cấp quyền vị trí hoặc nhập địa chỉ thủ công.',
          variant: 'destructive',
        });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const validateBookingBeforeSubmit = () => {
    const errors: Record<string, string> = {};

    if (!description.trim()) errors.description = 'Vui lòng mô tả yêu cầu';
    else if (description.trim().length < 10) errors.description = 'Mô tả quá ngắn (tối thiểu 10 ký tự)';

    if (!(addressMode === 'default' && selectedAddressId)) {
      if (!province) errors.province = 'Bắt buộc';
      if (!ward) errors.ward = 'Bắt buộc';
      if (!addressDetail.trim()) errors.addressDetail = 'Bắt buộc';
    }

    if (timeMode === 'scheduled') {
      const selectedDate = new Date(desiredTime);
      if (!desiredTime) errors.desiredTime = 'Vui lòng chọn thời gian';
      else if (isNaN(selectedDate.getTime())) errors.desiredTime = 'Thời gian không hợp lệ';
      else if (selectedDate < new Date()) errors.desiredTime = 'Thời gian phải ở tương lai';
    }

    return errors;
  };

  const focusBookingError = (errors: Record<string, string>) => {
    const firstError = Object.keys(errors)[0];
    const focusTarget: Record<string, string> = {
      description: 'booking-description',
      province: 'booking-province',
      ward: 'booking-ward',
      addressDetail: 'booking-address-detail',
      desiredTime: 'booking-desired-time',
    };

    if (firstError === 'description') setStep(1);
    else if (['province', 'ward', 'addressDetail'].includes(firstError)) {
      setAddressMode('custom');
      setStep(2);
    } else if (firstError === 'desiredTime') {
      setTimeMode('scheduled');
      setStep(3);
    }

    window.setTimeout(() => {
      const targetId = focusTarget[firstError];
      if (targetId) document.getElementById(targetId)?.focus();
    }, 80);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (step !== 3) return;
    if (submittedRef.current || loading) return;
    const errors = validateBookingBeforeSubmit();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusBookingError(errors);
      return;
    }

    submittedRef.current = true;
    setLoading(true);
    try {
      const itemsPayload = Object.values(selectedItems).map((it) => ({
        serviceItemId: it.serviceItemId,
        quantity: it.quantity,
      }));

      await bookingsApi.create({
        serviceId: Number(serviceId),
        description,
        province,
        district: district || NEW_ADMIN_DISTRICT_VALUE,
        ward,
        addressDetail,
        desiredTime: timeMode === 'now' ? new Date().toISOString() : new Date(desiredTime).toISOString(),
        items: itemsPayload.length > 0 ? itemsPayload : undefined,
      });
      toast({ title: 'Đặt dịch vụ thành công', description: 'Nhà cung cấp sẽ liên hệ bạn sớm.' });
      router.push('/bookings');
    } catch (err: ApiPayload) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message || 'Đã xảy ra lỗi', variant: 'destructive' });
    } finally {
      setLoading(false);
      submittedRef.current = false;
    }
  };

  // Step validation helpers
  const isStep1Valid = description.trim().length >= 10 && !fieldErrors.description;
  const isStep2Valid =
    addressMode === 'default' && selectedAddressId
      ? true
      : Boolean(province && ward && addressDetail && !fieldErrors.province && !fieldErrors.ward && !fieldErrors.addressDetail);

  return {
    router,
    serviceId,
    service,
    loading,
    addresses,
    addressesLoading,
    addressOptionsLoading,
    addressOptionsFallback,
    addressMode,
    setAddressMode,
    selectedAddressId,
    description,
    setDescription,
    province,
    district,
    ward,
    addressDetail,
    setAddressDetail,
    desiredTime,
    setDesiredTime,
    timeMode,
    setTimeMode,
    fieldErrors,
    setFieldErrors,
    selectedItems,
    setSelectedItems,
    step,
    setStep,
    gpsLoading,
    showSmartInput,
    setShowSmartInput,
    aiIntentResult,
    setAiIntentResult,
    defaultAddress,
    provinceOptions,
    wardOptions,
    formatPrice,
    applyAddress,
    useCustomAddress,
    validate,
    handleProvinceChange,
    handleWardChange,
    handleAutoLocate,
    handleSubmit,
    isStep1Valid,
    isStep2Valid,
  };
}
