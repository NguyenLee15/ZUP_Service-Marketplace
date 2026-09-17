'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Check, MapPin, Plus } from 'lucide-react';
import { useAddressManagementFlow } from '@/features/user/hooks/useAddressManagementFlow';
import { AddressCard } from '@/features/user/components/AddressCard';
import { AddressFormModal } from '@/features/user/components/AddressFormModal';
import { CustomerPageHeader } from '@/components/customer/CustomerPageHeader';

export default function AddressesPage() {
  const {
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
  } = useAddressManagementFlow();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <CustomerPageHeader
          eyebrow="Tài khoản"
          title="Quản lý địa chỉ"
          description="Lưu địa chỉ thường dùng để đặt dịch vụ nhanh hơn và nhận hỗ trợ chuẩn xác nhất."
        />
        <Button
          onClick={() => setShowModal(true)}
          className="rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Thêm địa chỉ mới
        </Button>
      </div>

      {successMessage && (
        <div
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:border-emerald-800/60 p-4 text-emerald-800 dark:text-emerald-200"
          aria-live="polite"
        >
          <Check className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div
          className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800/60 p-4 text-rose-800 dark:text-rose-200"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          [...Array(2)].map((_, index) => (
            <Card
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-border bg-card/60"
            />
          ))
        ) : addresses.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3 text-muted-foreground">
              <MapPin className="w-7 h-7" />
            </div>
            <p className="font-bold text-foreground text-base">Bạn chưa có địa chỉ nào</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Lưu địa chỉ nhà riêng hoặc văn phòng để thợ đến phục vụ thuận tiện và nhanh chóng nhất.
            </p>
            <Button
              onClick={() => setShowModal(true)}
              className="mt-5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Thêm địa chỉ ngay
            </Button>
          </Card>
        ) : (
          addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              actionId={actionId}
              onSetDefault={setDefaultAddress}
              onDelete={deleteAddress}
            />
          ))
        )}
      </div>

      {showModal && (
        <AddressFormModal
          form={form}
          selectedProvince={selectedProvince}
          selectedWard={selectedWard}
          provinceOptions={provinceOptions}
          wardOptions={wardOptions}
          addressOptionsLoading={addressOptionsLoading}
          addressOptionsFallback={addressOptionsFallback}
          provinceField={provinceField}
          wardField={wardField}
          handleProvinceSelect={handleProvinceSelect}
          onClose={closeModal}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}
