'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AdminBookingTimelineItem,
  BOOKING_STATUS_CONFIG,
  AdminBookingUser,
} from '../types/admin-booking-detail.types';

interface AdminBookingTimelineCardProps {
  statusHistory: AdminBookingTimelineItem[];
  customer?: AdminBookingUser | null;
  provider?: AdminBookingUser | null;
}

export function AdminBookingTimelineCard({
  statusHistory,
  customer,
  provider,
}: AdminBookingTimelineCardProps) {
  if (!statusHistory || statusHistory.length === 0) {
    return null;
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-3">
        <CardTitle className="text-sm font-bold text-slate-800">
          Lịch sử tiến độ
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="relative space-y-6 border-l-2 border-slate-100 pl-6">
          {statusHistory.map((h, i) => {
            const stepStatus = BOOKING_STATUS_CONFIG[h.toStatus] || {
              label: h.toStatus,
              color: 'bg-slate-100 text-slate-700 border-slate-200',
            };

            return (
              <div
                key={h.id || i}
                className="group relative transition-all duration-200"
              >
                {/* Circle marker */}
                <div
                  className={`absolute -left-[31px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-4 border-white shadow-sm transition-transform group-hover:scale-110 ${
                    h.toStatus === 'DONE'
                      ? 'bg-emerald-500'
                      : h.toStatus === 'DISPUTED'
                      ? 'bg-rose-500'
                      : h.toStatus === 'CANCELLED'
                      ? 'bg-slate-400'
                      : 'bg-blue-500'
                  }`}
                />

                <div className="flex flex-col gap-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold uppercase ${stepStatus.color}`}
                    >
                      {stepStatus.label}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      {formatDate(h.createdAt)}
                    </span>
                  </div>
                  {h.note && (
                    <div className="mt-1 flex flex-col gap-0.5 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs leading-normal text-slate-500">
                      {h.toStatus === 'CANCELLED' && h.changedBy && (
                        <span className="font-semibold text-slate-700">
                          [
                          {h.changedBy === customer?.id
                            ? 'Khách hàng hủy'
                            : h.changedBy === provider?.id
                            ? 'Nhà cung cấp hủy'
                            : 'Hệ thống/Quản trị viên hủy'}
                          ]
                        </span>
                      )}
                      <span>{h.note}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

