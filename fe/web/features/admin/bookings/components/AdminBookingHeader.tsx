'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookingStatusConfig } from '../types/admin-booking-detail.types';

interface AdminBookingHeaderProps {
  bookingCode: string;
  statusConfig: BookingStatusConfig;
  canCancel: boolean;
  onOpenCancelModal: () => void;
}

export function AdminBookingHeader({
  bookingCode,
  statusConfig,
  canCancel,
  onOpenCancelModal,
}: AdminBookingHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push('/admin/bookings')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50"
          title="Quay lại danh sách"
        >
          <ArrowLeft className="h-4 w-4 text-slate-600" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Chi Tiết Đơn Hàng
            </h1>
            <Badge
              className={`${statusConfig.color} border px-2.5 py-0.5 text-xs font-bold`}
            >
              {statusConfig.label}
            </Badge>
          </div>
          <p className="mt-1 font-mono text-xs text-slate-500">
            Mã đơn: #{bookingCode}
          </p>
        </div>
      </div>

      {canCancel && (
        <Button
          variant="destructive"
          onClick={onOpenCancelModal}
          className="h-10 gap-1.5 rounded-xl px-4 text-xs font-bold shadow-sm"
        >
          <XCircle className="h-4 w-4" /> Hủy Đơn Hàng
        </Button>
      )}
    </div>
  );
}

