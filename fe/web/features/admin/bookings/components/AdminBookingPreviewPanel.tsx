"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminBookingDetailFlow } from "../hooks/useAdminBookingDetailFlow";
import { AdminBookingServiceCard } from "./AdminBookingServiceCard";
import { AdminBookingPartiesCard } from "./AdminBookingPartiesCard";
import { AdminBookingTimelineCard } from "./AdminBookingTimelineCard";
import { AdminBookingQuotationCard } from "./AdminBookingQuotationCard";
import { AdminCancelBookingDialog } from "./AdminCancelBookingDialog";

interface AdminBookingPreviewPanelProps {
  bookingId: number | null;
  onCancelSuccess?: () => void;
}

export function AdminBookingPreviewPanel({
  bookingId,
  onCancelSuccess,
}: AdminBookingPreviewPanelProps) {
  const {
    booking,
    loading,
    cancelReason,
    showCancelModal,
    actionLoading,
    canCancel,
    statusHistory,
    setCancelReason,
    setShowCancelModal,
    handleCancelBooking,
  } = useAdminBookingDetailFlow(bookingId);

  if (!bookingId) {
    return (
      <Card className="h-full flex items-center justify-center p-8 text-center text-slate-400 border-dashed">
        <CardContent className="space-y-2">
          <Eye className="w-10 h-10 mx-auto stroke-1" />
          <p className="text-sm font-medium">Chọn một đơn hàng từ danh sách để xem chi tiết</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-slate-100 rounded-xl" />
        <div className="h-44 bg-slate-100 rounded-xl" />
        <div className="h-44 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  if (!booking) {
    return null;
  }

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
        <div>
          <span className="font-mono font-bold text-lg text-slate-800">
            #{booking.bookingCode}
          </span>
          <p className="text-xs text-slate-500 mt-0.5">
            Mã định danh: {booking.id}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 text-xs"
              onClick={() => setShowCancelModal(true)}
            >
              Hủy đơn
            </Button>
          )}
          <Button asChild size="sm" variant="default" className="text-xs gap-1">
            <Link href={`/admin/bookings/${booking.id}`}>
              <span>Xem trang đầy đủ</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <AdminBookingServiceCard booking={booking} />

      {booking.quotation && (
        <AdminBookingQuotationCard quotation={booking.quotation} />
      )}

      <AdminBookingPartiesCard booking={booking} />

      <AdminBookingTimelineCard
        statusHistory={statusHistory}
        customer={booking.customer}
        provider={booking.provider}
      />

      <AdminCancelBookingDialog
        open={showCancelModal}
        cancelReason={cancelReason}
        actionLoading={actionLoading}
        onOpenChange={setShowCancelModal}
        onReasonChange={setCancelReason}
        onConfirmCancel={async () => {
          await handleCancelBooking();
          onCancelSuccess?.();
        }}
      />
    </div>
  );
}

