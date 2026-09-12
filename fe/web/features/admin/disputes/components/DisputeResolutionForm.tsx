'use client';

import React from 'react';
import {
  Gavel,
  CheckCircle2,
  Banknote,
  AlertCircle,
  Loader2,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DisputeDetailData } from '../types/dispute-detail.types';

interface DisputeResolutionFormProps {
  dispute: DisputeDetailData;
  quotationPrice: number | null;
  decision: 'COMPLETE' | 'PENALIZE' | null;
  reason: string;
  penaltyAmount: string;
  submitting: boolean;
  onDecisionChange: (decision: 'COMPLETE' | 'PENALIZE') => void;
  onReasonChange: (reason: string) => void;
  onPenaltyAmountChange: (amount: string) => void;
  onSubmit: () => void;
}

export function DisputeResolutionForm({
  dispute,
  quotationPrice,
  decision,
  reason,
  penaltyAmount,
  submitting,
  onDecisionChange,
  onReasonChange,
  onPenaltyAmountChange,
  onSubmit,
}: DisputeResolutionFormProps) {
  const isResolved = dispute.status === 'RESOLVED';

  const formatPrice = (p: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  return (
    <Card className="rounded-2xl border-slate-200 shadow-sm lg:sticky lg:top-6">
      <CardHeader className="border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
            <Gavel className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-slate-800">
              Phán Quyết
            </CardTitle>
            {quotationPrice != null && (
              <p className="mt-0.5 text-[10px] text-slate-400">
                Giá trị đơn:{' '}
                <strong className="text-blue-600">{formatPrice(quotationPrice)}</strong>
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {!isResolved ? (
          <>
            {/* COMPLETE Option */}
            <button
              type="button"
              onClick={() => onDecisionChange('COMPLETE')}
              className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                decision === 'COMPLETE'
                  ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    decision === 'COMPLETE'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Hoàn thành đơn hàng</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Bác bỏ khiếu nại — trả tiền cho thợ (trừ hoa hồng)
                  </p>
                </div>
              </div>
            </button>

            {/* PENALIZE Option */}
            <button
              type="button"
              onClick={() => onDecisionChange('PENALIZE')}
              className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                decision === 'PENALIZE'
                  ? 'border-red-500 bg-red-50 shadow-md shadow-red-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    decision === 'PENALIZE'
                      ? 'bg-red-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Phạt nhà cung cấp</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Trừ tiền phạt từ ví NCC (hoặc khóa tài khoản nếu ví âm)
                  </p>
                </div>
              </div>
            </button>

            {/* Penalty Amount Input */}
            {decision === 'PENALIZE' && (
              <div className="space-y-2 rounded-xl border border-red-200 bg-red-50 p-4 animate-in slide-in-from-top-2 duration-200">
                <label className="block text-xs font-bold text-red-700">
                  Số tiền phạt (VNĐ) *
                </label>
                <Input
                  type="number"
                  min="0"
                  value={penaltyAmount}
                  onChange={(e) => onPenaltyAmountChange(e.target.value)}
                  placeholder={
                    quotationPrice
                      ? `Tối đa: ${formatPrice(quotationPrice)}`
                      : 'Nhập số tiền phạt...'
                  }
                  className="border-red-200 bg-white focus:border-red-400 focus:ring-red-400/20"
                />
                {quotationPrice && Number(penaltyAmount) > quotationPrice && (
                  <p className="flex items-center gap-1 text-[10px] font-medium text-red-500">
                    <AlertCircle className="h-3 w-3" />
                    Số tiền phạt vượt quá giá trị đơn hàng
                  </p>
                )}
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Lý do phán quyết *
              </label>
              <Textarea
                value={reason}
                onChange={(e) => onReasonChange(e.target.value)}
                placeholder="Mô tả chi tiết căn cứ phán quyết, bằng chứng đã đối chiếu..."
                rows={4}
                className="resize-none border-slate-200 text-sm focus:border-blue-400 focus:ring-blue-400/20"
              />
            </div>

            {/* Submit Button */}
            <Button
              onClick={onSubmit}
              disabled={submitting || !decision}
              className={`h-12 w-full rounded-xl text-sm font-bold shadow-lg transition-all ${
                decision === 'PENALIZE'
                  ? 'bg-red-600 shadow-red-500/20 hover:bg-red-700'
                  : decision === 'COMPLETE'
                  ? 'bg-emerald-600 shadow-emerald-500/20 hover:bg-emerald-700'
                  : 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400 shadow-none'
              }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Gavel className="mr-2 h-4 w-4" />
                  Chốt Phán Quyết
                </>
              )}
            </Button>

            {/* Warning */}
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-[11px] font-bold text-amber-800">Không thể hoàn tác</p>
                <p className="mt-0.5 text-[10px] text-amber-600">
                  Phán quyết sẽ tự động thực thi giao dịch tài chính (trừ hoa hồng hoặc trừ tiền phạt).
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
              <Shield className="h-7 w-7 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-slate-800">
              Tranh chấp đã được giải quyết
            </p>
            <p className="mx-auto mt-2 max-w-[250px] text-xs leading-relaxed text-slate-500">
              {dispute.resolutionReason}
            </p>
            <div className="mt-4 border-t border-slate-100 pt-4">
              <Badge
                className={`border-0 px-3 py-1 text-[10px] font-bold ${
                  dispute.resolutionAction === 'COMPLETE'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {dispute.resolutionAction === 'COMPLETE' ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Gavel className="w-3 h-3" /> Phạt NCC
                  </span>
                )}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

