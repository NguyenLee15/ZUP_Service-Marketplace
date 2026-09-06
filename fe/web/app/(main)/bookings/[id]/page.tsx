'use client';

import React from 'react';
import { BackButton } from '@/components/navigation/BackButton';
import { useBookingDetailFlow } from '@/features/booking/hooks/useBookingDetailFlow';
import { BookingHeaderStepper } from '@/features/booking/components/detail/BookingHeaderStepper';
import { BookingProviderCard } from '@/features/booking/components/detail/BookingProviderCard';
import { BookingHistoryTimeline } from '@/features/booking/components/detail/BookingHistoryTimeline';
import { BookingLocationCard } from '@/features/booking/components/detail/BookingLocationCard';
import { BookingQuotationTable } from '@/features/booking/components/detail/BookingQuotationTable';
import { BookingActionButtons } from '@/features/booking/components/detail/BookingActionButtons';
import { BookingActionDialogs } from '@/features/booking/components/detail/BookingActionDialogs';
import { BookingInlineReview } from '@/features/booking/components/detail/BookingInlineReview';

export default function BookingDetailPage() {
  const {
    booking,
    loading,
    actionLoading,
    handleAction,
    formatPrice,
    formatDate,
    timeLeft,
    isCustomer,
    statusHistory,
    originalQuote,
    supplementaryQuotes,
    showReview,
    setShowReview,
    rating,
    setRating,
    comment,
    setComment,
    cancelAction,
    setCancelAction,
    cancelReason,
    setCancelReason,
    disputeFiles,
    setDisputeFiles,
  } = useBookingDetailFlow();

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="h-96 glass-panel rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!booking) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {/* Back */}
      <BackButton fallbackHref="/bookings" />

      {/* Header, Code, Status & Stepper */}
      <BookingHeaderStepper booking={booking} timeLeft={timeLeft} />

      {/* Provider Info & Chat CTA */}
      <BookingProviderCard booking={booking} />

      {/* History Timeline */}
      <BookingHistoryTimeline statusHistory={statusHistory} formatDate={formatDate} />

      {/* Address & Surveyor */}
      <BookingLocationCard booking={booking} formatDate={formatDate} />

      {/* Original and Supplementary Quotations */}
      <BookingQuotationTable
        booking={booking}
        originalQuote={originalQuote}
        supplementaryQuotes={supplementaryQuotes}
        isCustomer={isCustomer}
        actionLoading={actionLoading}
        handleAction={handleAction}
        formatPrice={formatPrice}
      />

      {/* Review Display & Form */}
      <BookingInlineReview
        booking={booking}
        showReview={showReview}
        setShowReview={setShowReview}
        rating={rating}
        setRating={setRating}
        comment={comment}
        setComment={setComment}
        actionLoading={actionLoading}
        handleAction={handleAction}
      />

      {/* Action Buttons */}
      <BookingActionButtons
        booking={booking}
        isCustomer={isCustomer}
        actionLoading={actionLoading}
        handleAction={handleAction}
        setShowReview={setShowReview}
        setCancelAction={setCancelAction}
      />

      {/* Dialogs: Cancel / Reject / Dispute */}
      <BookingActionDialogs
        booking={booking}
        cancelAction={cancelAction}
        setCancelAction={setCancelAction}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        disputeFiles={disputeFiles}
        setDisputeFiles={setDisputeFiles}
        actionLoading={actionLoading}
        handleAction={handleAction}
      />
    </div>
  );
}
