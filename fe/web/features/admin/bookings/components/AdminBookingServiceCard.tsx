'use client';

import React from 'react';
import { FileText, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminBookingDetailData } from '../types/admin-booking-detail.types';

interface AdminBookingServiceCardProps {
  booking: AdminBookingDetailData;
}

export function AdminBookingServiceCard({ booking }: AdminBookingServiceCardProps) {
  const formatDate = (d?: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <FileText className="h-4 w-4 text-blue-600" /> Dịch vụ yêu cầu
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            {booking.service?.name || '—'}
          </h3>
          {booking.service?.category?.name && (
            <span className="mt-1.5 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
              {booking.service.category.name}
            </span>
          )}
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            Mô tả công việc
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {booking.description || 'Không có mô tả chi tiết.'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
          <div className="flex items-center gap-2.5 text-sm text-slate-600">
            <Clock className="h-4 w-4 text-slate-400" />
            <span>
              Thời gian mong muốn:{' '}
              <strong>{formatDate(booking.desiredTime)}</strong>
            </span>
          </div>
          {booking.surveyorName && (
            <div className="flex items-center gap-2.5 border-t border-slate-100 text-sm text-slate-600 sm:border-l sm:border-t-0 sm:pl-4">
              <User className="h-4 w-4 text-slate-400" />
              <span>
                Thợ khảo sát: <strong>{booking.surveyorName}</strong>{' '}
                {booking.surveyorPhone ? `(${booking.surveyorPhone})` : ''}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

