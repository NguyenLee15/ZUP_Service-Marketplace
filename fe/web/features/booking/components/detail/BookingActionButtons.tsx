'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, RefreshCw, Star, XCircle } from 'lucide-react';
import { BookingStatus } from '@/types';
import { bookingsApi } from '@/features/auth/services/api';

interface BookingActionButtonsProps {
  booking: ApiPayload;
  isCustomer: boolean;
  actionLoading: boolean;
  handleAction: (action: () => Promise<ApiPayload>, msg: string) => Promise<void>;
  setShowReview: (show: boolean) => void;
  setCancelAction: (action: 'CANCEL' | 'REJECT' | 'DISPUTE' | null) => void;
}

export function BookingActionButtons({
  booking,
  isCustomer,
  actionLoading,
  handleAction,
  setShowReview,
  setCancelAction,
}: BookingActionButtonsProps) {
  return (
    <div className="space-y-2 pt-2">
      {/* Customer: Confirm / Reject quote */}
      {isCustomer && booking.status === BookingStatus.QUOTED && (
        <div className="flex gap-2">
          <Button
            onClick={() =>
              handleAction(
                () => bookingsApi.confirmQuote(booking.id),
                'Đã chấp nhận báo giá',
              )
            }
            disabled={actionLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-1" /> Đồng ý báo giá
          </Button>
          <Button
            onClick={() => setCancelAction('REJECT')}
            variant="outline"
            className="flex-1 border-red-200 text-red-600"
          >
            <XCircle className="w-4 h-4 mr-1" /> Từ chối
          </Button>
        </div>
      )}

      {/* Customer: Post-Service UX (DONE) */}
      {isCustomer && booking.status === BookingStatus.DONE && !booking.review && (
        <div className="glass-panel flex flex-col gap-3 mt-8 p-6 rounded-2xl">
          <div className="text-center mb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Công việc đã hoàn tất
            </h3>
            <p className="text-sm text-muted-foreground">
              Bạn có hài lòng với dịch vụ không? Hãy chia sẻ trải nghiệm của bạn.
            </p>
          </div>

          <Button
            onClick={() => {
              if (!booking.autoCompletedAt) {
                // Nếu chưa nghiệm thu, nghiệm thu trước rồi mở form đánh giá
                handleAction(
                  () => bookingsApi.accept(booking.id),
                  'Đã nghiệm thu thành công',
                ).then(() => setShowReview(true));
              } else {
                setShowReview(true);
              }
            }}
            disabled={actionLoading}
            className="w-full bg-action-blue hover:bg-glacier-blue text-white rounded-xl shadow-[0_0_15px_rgba(0,107,255,0.3)] py-6 font-bold text-base transition-[background-color,box-shadow,transform] hover:-translate-y-0.5"
          >
            <Star className="w-5 h-5 mr-2 fill-white text-white" /> Đánh giá & Nghiệm thu
          </Button>

          <Button
            onClick={() => setCancelAction('DISPUTE')}
            variant="ghost"
            className="w-full text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl"
          >
            <AlertTriangle className="w-4 h-4 mr-2" /> Có vấn đề? Mở khiếu nại
          </Button>
        </div>
      )}

      {/* Customer: Cancel (PENDING / ACCEPTED / QUOTED only) */}
      {isCustomer &&
        [BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.QUOTED].includes(
          booking.status,
        ) && (
          <Button
            onClick={() => setCancelAction('CANCEL')}
            variant="outline"
            className="w-full border-red-200 text-red-600"
          >
            Hủy đơn
          </Button>
        )}

      {/* Customer: Rebook for CANCELLED or completed bookings */}
      {isCustomer &&
        [BookingStatus.CANCELLED, BookingStatus.DONE].includes(booking.status) && (
          <Button
            onClick={() =>
              handleAction(
                () => bookingsApi.rebook(booking.id),
                'Đã đặt lại dịch vụ thành công!',
              )
            }
            disabled={actionLoading}
            variant="outline"
            className="w-full border-platinum-tint text-action-blue hover:bg-pale-gray"
          >
            <RefreshCw className="w-4 h-4 mr-1" /> Đặt lại dịch vụ
          </Button>
        )}
    </div>
  );
}

