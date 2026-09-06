'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DisputeDetailData } from '../types/dispute-detail.types';

interface DisputeHeaderBannerProps {
  dispute: DisputeDetailData;
}

export function DisputeHeaderBanner({ dispute }: DisputeHeaderBannerProps) {
  const router = useRouter();
  const isResolved = dispute.status === 'RESOLVED';

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/disputes')}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50"
            title="Quay lại danh sách"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">
                Phân Xử Tranh Chấp
              </h3>
              <Badge
                className={`border-0 px-2.5 py-0.5 text-[10px] font-bold ${
                  isResolved
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'animate-pulse bg-rose-100 text-rose-700'
                }`}
              >
                {isResolved ? '✓ Đã phân định' : '⚡ Chờ phân xử'}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-semibold">Tranh chấp #{dispute.id}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-slate-600">
                {dispute.booking?.bookingCode ? `#${dispute.booking.bookingCode}` : 'N/A'}
              </span>
              <span className="text-slate-300">•</span>
              <Clock className="h-3 w-3" />
              <span>{formatDate(dispute.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {isResolved && (
        <div className="flex items-start gap-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="mb-1 text-sm font-bold text-emerald-800">
              Phán quyết:{' '}
              {dispute.resolutionAction === 'COMPLETE'
                ? '✅ Hoàn thành đơn hàng — trừ hoa hồng'
                : `⚖️ Phạt nhà cung cấp — trừ ${
                    dispute.penaltyAmount
                      ? formatPrice(Number(dispute.penaltyAmount))
                      : 'tiền phạt'
                  } từ ví`}
            </p>
            <p className="text-xs leading-relaxed text-emerald-600">
              {dispute.resolutionReason}
            </p>
            {dispute.resolvedAt && (
              <p className="mt-2 flex items-center gap-1 text-[10px] text-emerald-500">
                <Clock className="h-3 w-3" />
                Giải quyết lúc: {formatDate(dispute.resolvedAt)}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

