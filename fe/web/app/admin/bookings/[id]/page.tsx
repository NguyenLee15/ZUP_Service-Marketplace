'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AdminPermissionGuard } from '@/features/admin/components/AdminPermissionGuard';
import { AdminPermission } from '@/types/admin-permissions';
import { useAdminBookingDetailFlow } from '@/features/admin/bookings/hooks/useAdminBookingDetailFlow';
import {
  AdminBookingHeader,
  AdminBookingServiceCard,
  AdminBookingQuotationCard,
  AdminBookingDisputeCard,
  AdminBookingReviewCard,
  AdminBookingPartiesCard,
  AdminBookingTimelineCard,
  AdminCancelBookingDialog,
} from '@/features/admin/bookings/components';

function BookingDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <div className="h-10 w-32 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-24 animate-pulse rounded-2xl border bg-slate-100" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-48 animate-pulse rounded-2xl border bg-slate-100" />
          <div className="h-64 animate-pulse rounded-2xl border bg-slate-100" />
        </div>
        <div className="h-96 animate-pulse rounded-2xl border bg-slate-100" />
      </div>
    </div>
  );
}

function AdminBookingDetailContent() {
  const params = useParams();
  const bookingId = params?.id ? Number(params.id) : null;

  const {
    booking,
    loading,
    cancelReason,
    showCancelModal,
    actionLoading,
    statusConfig,
    canCancel,
    statusHistory,
    setCancelReason,
    setShowCancelModal,
    handleCancelBooking,
  } = useAdminBookingDetailFlow(bookingId);

  if (loading) {
    return <BookingDetailSkeleton />;
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <AdminBookingHeader
        bookingCode={booking.bookingCode}
        statusConfig={statusConfig}
        canCancel={canCancel}
        onOpenCancelModal={() => setShowCancelModal(true)}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (Service, Quotation, Dispute, Review) */}
        <div className="space-y-6 lg:col-span-2">
          <AdminBookingServiceCard booking={booking} />

          {booking.quotation && (
            <AdminBookingQuotationCard quotation={booking.quotation} />
          )}

          {booking.dispute && (
            <AdminBookingDisputeCard dispute={booking.dispute} />
          )}

          {booking.review && (
            <AdminBookingReviewCard review={booking.review} />
          )}
        </div>

        {/* Right Column (Parties involved, Address, Timeline) */}
        <div className="space-y-6">
          <AdminBookingPartiesCard booking={booking} />

          <AdminBookingTimelineCard
            statusHistory={statusHistory}
            customer={booking.customer}
            provider={booking.provider}
          />
        </div>
      </div>

      <AdminCancelBookingDialog
        open={showCancelModal}
        cancelReason={cancelReason}
        actionLoading={actionLoading}
        onOpenChange={setShowCancelModal}
        onReasonChange={setCancelReason}
        onConfirmCancel={handleCancelBooking}
      />
    </div>
  );
}

export default function AdminBookingDetailPage() {
  return (
    <AdminPermissionGuard permission={AdminPermission.BOOKING_VIEW}>
      <AdminBookingDetailContent />
    </AdminPermissionGuard>
  );
}
