'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { UseFormReturn } from 'react-hook-form';
import { AddressFormData } from '../hooks/useAddressManagementFlow';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const MapPicker = dynamic(
  () => import('@/components/customer/address-map-picker'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
      </div>
    ),
  },
);

interface AddressFormModalProps {
  form: UseFormReturn<AddressFormData>;
  selectedProvince: string;
  selectedWard: string;
  provinceOptions: string[];
  wardOptions: string[];
  addressOptionsLoading: boolean;
  addressOptionsFallback: boolean;
  provinceField: any;
  wardField: any;
  handleProvinceSelect: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  onClose: () => void;
  onSubmit: (data: AddressFormData) => void;
}

export function AddressFormModal({
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
  onClose,
  onSubmit,
}: AddressFormModalProps) {
  return (
    <Dialog open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border border-border bg-card">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <DialogTitle className="text-xl font-semibold text-foreground">
            Thêm địa chỉ mới
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[75vh] overflow-y-auto p-6">
          <div className="mb-6 space-y-3">
            <p className="text-sm font-medium text-foreground">
              Chọn vị trí trên bản đồ
            </p>
            <MapPicker
              latitude={form.watch('latitude') || 21.028511}
              longitude={form.watch('longitude') || 105.804817}
              searchSuffix={
                selectedProvince && selectedWard
                  ? `${selectedWard}, ${selectedProvince}`
                  : undefined
              }
              onChange={(lat, lng, details) => {
                form.setValue('latitude', lat, { shouldDirty: true });
                form.setValue('longitude', lng, { shouldDirty: true });

                if (details) {
                  if (details.province) {
                    const matchedProvince = provinceOptions.find(
                      (p) =>
                        p.includes(details.province) ||
                        details.province.includes(p) ||
                        p.replace(/Tỉnh |Thành phố /g, '') ===
                          details.province.replace(/Tỉnh |Thành phố /g, ''),
                    );
                    if (matchedProvince) {
                      form.setValue('province', matchedProvince, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    } else {
                      form.setValue('province', details.province, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }
                  }
                  if (details.district) {
                    form.setValue('district', details.district, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                  if (details.ward) {
                    form.setValue('ward', details.ward, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                  if (details.street) {
                    form.setValue('addressDetail', details.street, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }
                }
              }}
            />
          </div>

          <div className="mb-4 rounded-xl border border-platinum-tint bg-pale-gray/45 px-4 py-3 text-xs text-muted-foreground">
            {addressOptionsLoading ? (
              <span className="font-medium text-action-blue">
                Đang tải danh sách tỉnh và phường/xã theo địa giới mới…
              </span>
            ) : addressOptionsFallback ? (
              <span className="font-medium text-amber-600">
                Tạm dùng danh sách rút gọn do chưa tải được dữ liệu địa giới
                mới.
              </span>
            ) : (
              <span>
                Danh sách tỉnh và phường/xã/đặc khu đã được tải theo địa giới sau
                sáp nhập.
              </span>
            )}
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...form.register('district')} />
            <div>
              <label
                htmlFor="address-label"
                className="mb-2 block text-sm font-medium text-foreground/80"
              >
                Nhãn địa chỉ
              </label>
              <Input
                id="address-label"
                placeholder="Nhà riêng, công ty…"
                autoComplete="off"
                {...form.register('label')}
              />
              {form.formState.errors.label && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.label.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="address-province"
                  className="mb-2 block text-sm font-medium text-foreground/80"
                >
                  Tỉnh/thành phố
                </label>
                <select
                  id="address-province"
                  autoComplete="address-level1"
                  {...provinceField}
                  value={selectedProvince}
                  onChange={handleProvinceSelect}
                  className="w-full rounded-lg border border-platinum-tint bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-action-blue"
                >
                  <option value="">Chọn tỉnh/thành</option>
                  {provinceOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {form.formState.errors.province && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.province.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="address-ward"
                  className="mb-2 block text-sm font-medium text-foreground/80"
                >
                  Phường/xã/đặc khu
                </label>
                <select
                  id="address-ward"
                  autoComplete="address-level3"
                  {...wardField}
                  value={selectedWard}
                  onChange={wardField.onChange}
                  disabled={!selectedProvince}
                  className="w-full rounded-lg border border-platinum-tint bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-action-blue"
                >
                  <option value="">
                    {selectedProvince
                      ? 'Chọn phường/xã/đặc khu'
                      : 'Chọn tỉnh trước'}
                  </option>
                  {wardOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                {form.formState.errors.ward && (
                  <p className="mt-1 text-sm text-red-600">
                    {form.formState.errors.ward.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="address-detail"
                className="mb-2 block text-sm font-medium text-foreground/80"
              >
                Địa chỉ chi tiết
              </label>
              <textarea
                id="address-detail"
                placeholder="Số nhà, tên đường…"
                autoComplete="street-address"
                {...form.register('addressDetail')}
                rows={3}
                className="w-full rounded-lg border border-platinum-tint bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-action-blue"
              />
              {form.formState.errors.addressDetail && (
                <p className="mt-1 text-sm text-red-600">
                  {form.formState.errors.addressDetail.message}
                </p>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                {...form.register('isDefault')}
                className="h-4 w-4 rounded border-platinum-tint text-action-blue focus:ring-action-blue"
              />
              <span className="text-sm text-foreground/80">
                Đặt làm địa chỉ mặc định
              </span>
            </label>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="flex-1 bg-action-blue text-white hover:bg-glacier-blue"
              >
                {form.formState.isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang lưu…
                  </span>
                ) : (
                  'Lưu địa chỉ'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

