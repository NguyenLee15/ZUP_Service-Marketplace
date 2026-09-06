'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminBookingDispute } from '../types/admin-booking-detail.types';

interface AdminBookingDisputeCardProps {
  dispute: AdminBookingDispute;
}

export function AdminBookingDisputeCard({ dispute }: AdminBookingDisputeCardProps) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <Card className="rounded-2xl border-red-100 bg-red-50/10 shadow-sm">
      <CardHeader className="border-b border-red-100/40 pb-3">
        <CardTitle className="flex items-center gap-1.5 text-sm font-bold text-rose-700">
          <ShieldAlert className="h-4 w-4 text-rose-600" /> Tranh chấp khiếu nại đang mở
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3.5 pt-4 text-sm">
        <div className="rounded-xl border border-red-100/30 bg-white p-3">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Lý do khiếu nại
          </span>
          <p className="mt-1 text-sm font-medium leading-relaxed text-slate-800">
            {dispute.reason}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-red-100/30 bg-white p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Trạng thái tranh chấp
            </span>
            <Badge className="mt-1 border-0 bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
              {dispute.status}
            </Badge>
          </div>
          <div className="rounded-xl border border-red-100/30 bg-white p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Thời điểm tạo
            </span>
            <span className="mt-1 block font-semibold text-slate-700">
              {formatDate(dispute.createdAt)}
            </span>
          </div>
        </div>

        {dispute.resolutionReason && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              Phán quyết từ quản trị
            </span>
            <p className="mt-1 text-xs leading-relaxed text-emerald-700">
              {dispute.resolutionReason}
            </p>
            {dispute.resolutionAction && (
              <Badge className="mt-2 border-0 bg-emerald-100 text-[10px] font-bold text-emerald-800">
                {dispute.resolutionAction === 'COMPLETE' ? 'Hoàn thành' : 'Phạt thợ'}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

