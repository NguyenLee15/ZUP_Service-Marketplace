'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Check, MapPin, Plus } from 'lucide-react';
import { useAddressManagementFlow } from '@/features/user/hooks/useAddressManagementFlow';
import { AddressCard } from '@/features/user/components/AddressCard';
import { AddressFormModal } from '@/features/user/components/AddressFormModal';

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
        <div>
          <h1 className="text-3xl font-bold brand-heading">Quản lý địa chỉ</h1>
          <p className="text-muted-foreground mt-1">
            Danh sách này được tải theo tài khoản đang đăng nhập.
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-action-blue hover:bg-glacier-blue text-white flex items-center gap-2 shadow-[var(--brand-shadow-button)]"
        >
          <Plus className="w-5 h-5" />
          Thêm địa chỉ
        </Button>
      </div>

      {successMessage && (
        <div
          className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800"
          aria-live="polite"
        >
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div
          className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
        </div>
      )}

      <div className="grid gap-4">
        {loading ? (
          [...Array(2)].map((_, index) => (
            <Card
              key={index}
              className="surface-card h-32 animate-pulse rounded-[20px]"
            />
          ))
        ) : addresses.length === 0 ? (
          <Card className="surface-card rounded-[20px] p-8 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="font-semibold text-foreground">Bạn chưa có địa chỉ nào</p>
            <p className="text-sm text-muted-foreground mt-1">
              Thêm địa chỉ mới để đặt dịch vụ nhanh hơn.
            </p>
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
          onSubmit={form.handleSubmit(onSubmit)}
        />
      )}
    </div>
  );
}
