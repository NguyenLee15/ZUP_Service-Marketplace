'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminBookingQuotation } from '../types/admin-booking-detail.types';

interface AdminBookingQuotationCardProps {
  quotation: AdminBookingQuotation;
}

export function AdminBookingQuotationCard({ quotation }: AdminBookingQuotationCardProps) {
  const formatPrice = (p: number) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(p);

  return (
    <Card className="rounded-2xl border-blue-100 bg-gradient-to-br from-blue-50/20 to-indigo-50/10 shadow-sm">
      <CardHeader className="border-b border-blue-100/50 pb-3">
        <CardTitle className="text-sm font-bold text-blue-700">
          Chi tiết báo giá thợ gửi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3.5 pt-4 text-sm">
        <div className="flex items-center justify-between rounded-xl border border-blue-100/30 bg-white/70 p-3">
          <span className="font-medium text-slate-500">Giá thực tế của đơn</span>
          <span className="text-xl font-black text-blue-700">
            {formatPrice(Number(quotation.actualPrice))}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-blue-100/20 bg-white/50 p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Thời gian thi công
            </span>
            <span className="mt-1 block font-semibold text-slate-700">
              {quotation.estimatedTime || '—'}
            </span>
          </div>
          <div className="rounded-xl border border-blue-100/20 bg-white/50 p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tỷ lệ hoa hồng (Snapshot)
            </span>
            <span className="mt-1 block font-semibold text-amber-600">
              {quotation.commissionRateSnapshot != null
                ? `${quotation.commissionRateSnapshot}%`
                : '—'}
            </span>
          </div>
        </div>

        {quotation.note && (
          <div className="rounded-xl border border-blue-100/20 bg-white/50 p-3">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ghi chú từ thợ
            </span>
            <p className="text-xs leading-relaxed text-slate-600">
              {quotation.note}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

