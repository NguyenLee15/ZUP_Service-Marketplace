'use client';

import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useCreateBookingFlow } from '@/features/booking/hooks/useCreateBookingFlow';
import { BookingStepIndicator } from '@/features/booking/components/create/BookingStepIndicator';
import { BookingServiceCard } from '@/features/booking/components/create/BookingServiceCard';
import { BookingItemsSelector } from '@/features/booking/components/create/BookingItemsSelector';
import { BookingAddressSelector } from '@/features/booking/components/create/BookingAddressSelector';
import { BookingSchedulePicker } from '@/features/booking/components/create/BookingSchedulePicker';

export default function CreateBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="h-96 bg-muted rounded-xl animate-pulse" />
        </div>
      }
    >
      <CreateBookingContent />
    </Suspense>
  );
}

function CreateBookingContent() {
  const {
    router,
    serviceId,
    service,
    loading,
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
  } = useCreateBookingFlow();

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      {/* Wizard step progress */}
      <BookingStepIndicator
        step={step}
        setStep={setStep}
        isStep1Valid={isStep1Valid}
        isStep2Valid={isStep2Valid}
      />

      {/* Service Header Info */}
      <BookingServiceCard service={service} />

      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
        className="space-y-4 sm:space-y-5"
      >
        {/* STEP 1: Hạng mục & Mô tả */}
        {step === 1 && (
          <BookingItemsSelector
            showSmartInput={showSmartInput}
            setShowSmartInput={setShowSmartInput}
            serviceId={serviceId}
            service={service}
            description={description}
            setDescription={setDescription}
            fieldErrors={fieldErrors}
            validate={validate}
            setAiIntentResult={setAiIntentResult}
            onServiceSelect={(svcId) => router.push(`/bookings/create?serviceId=${svcId}`)}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            formatPrice={formatPrice}
          />
        )}

        {/* STEP 2: Địa chỉ thực hiện */}
        {step === 2 && (
          <BookingAddressSelector
            addressMode={addressMode}
            setAddressMode={setAddressMode}
            selectedAddressId={selectedAddressId}
            defaultAddress={defaultAddress}
            addressesLoading={addressesLoading}
            addressOptionsLoading={addressOptionsLoading}
            addressOptionsFallback={addressOptionsFallback}
            applyAddress={applyAddress}
            useCustomAddress={useCustomAddress}
            gpsLoading={gpsLoading}
            handleAutoLocate={handleAutoLocate}
            province={province}
            district={district}
            ward={ward}
            addressDetail={addressDetail}
            setAddressDetail={setAddressDetail}
            fieldErrors={fieldErrors}
            validate={validate}
            handleProvinceChange={handleProvinceChange}
            handleWardChange={handleWardChange}
            provinceOptions={provinceOptions}
            wardOptions={wardOptions}
          />
        )}

        {/* STEP 3: Lên lịch & Xác nhận */}
        {step === 3 && (
          <BookingSchedulePicker
            timeMode={timeMode}
            setTimeMode={setTimeMode}
            desiredTime={desiredTime}
            setDesiredTime={setDesiredTime}
            fieldErrors={fieldErrors}
            setFieldErrors={setFieldErrors}
            validate={validate}
            service={service}
            addressDetail={addressDetail}
            ward={ward}
            selectedItems={selectedItems}
            formatPrice={formatPrice}
          />
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 pt-3 border-t border-white/5">
          {step > 1 && (
            <Button
              type="button"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              variant="outline"
              className="flex-1 h-12 rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white flex items-center justify-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Quay lại
            </Button>
          )}

          {step < 3 ? (
            <Button
              type="button"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
              disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
              className="flex-1 h-12 bg-action-blue hover:bg-glacier-blue text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 shadow-[0_4px_15px_rgba(0,107,255,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Tiếp tục
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={loading}
              className="flex-[2] h-12 bg-gradient-to-r from-action-blue to-glacier-blue hover:from-glacier-blue hover:to-action-blue text-white font-extrabold rounded-xl shadow-[0_4px_20px_rgba(0,107,255,0.3)] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xử lý đặt lịch…
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Xác nhận đặt dịch vụ
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
