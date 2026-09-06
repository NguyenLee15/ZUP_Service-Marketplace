'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { bookingsApi } from '@/features/auth/services/api';

interface BookingActionDialogsProps {
  booking: ApiPayload;
  cancelAction: 'CANCEL' | 'REJECT' | 'DISPUTE' | null;
  setCancelAction: (action: 'CANCEL' | 'REJECT' | 'DISPUTE' | null) => void;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  disputeFiles: File[];
  setDisputeFiles: (files: File[]) => void;
  actionLoading: boolean;
  handleAction: (action: () => Promise<ApiPayload>, msg: string) => Promise<void>;
}

export function BookingActionDialogs({
  booking,
  cancelAction,
  setCancelAction,
  cancelReason,
  setCancelReason,
  disputeFiles,
  setDisputeFiles,
  actionLoading,
  handleAction,
}: BookingActionDialogsProps) {
  const cancelDialogCopy =
    cancelAction === 'REJECT'
      ? {
          title: 'Từ chối báo giá',
          description: 'Cho nhà cung cấp biết lý do bạn chưa đồng ý với báo giá này.',
          label: 'Lý do từ chối',
          placeholder: 'Ví dụ: giá vượt ngân sách hoặc hạng mục chưa phù hợp…',
          confirm: 'Từ chối báo giá',
        }
      : cancelAction === 'DISPUTE'
      ? {
          title: 'Gửi khiếu nại',
          description: 'Mô tả vấn đề để đội ngũ hỗ trợ có đủ thông tin xử lý.',
          label: 'Nội dung khiếu nại',
          placeholder: 'Ví dụ: công việc chưa hoàn tất hoặc phát sinh hư hỏng…',
          confirm: 'Gửi khiếu nại',
        }
      : {
          title: 'Hủy đơn',
          description: 'Lý do hủy sẽ được lưu vào lịch sử và gửi cho nhà cung cấp.',
          label: 'Lý do hủy',
          placeholder: 'Ví dụ: tôi chọn nhầm thời gian hoặc không còn nhu cầu…',
          confirm: 'Hủy đơn',
        };

  return (
    <Dialog
      open={!!cancelAction}
      onOpenChange={(open) => {
        if (!open) {
          setCancelAction(null);
          setCancelReason('');
          setDisputeFiles([]);
        }
      }}
    >
      <DialogContent className="glass-panel rounded-2xl border-red-500/20 border-l-4">
        <DialogHeader>
          <DialogTitle className="text-red-600">{cancelDialogCopy.title}</DialogTitle>
          <DialogDescription>{cancelDialogCopy.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label
            htmlFor="booking-cancel-reason"
            className="text-sm font-semibold text-foreground"
          >
            {cancelDialogCopy.label}
          </label>
          <Textarea
            id="booking-cancel-reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={cancelDialogCopy.placeholder}
            rows={2}
            className="bg-card/50"
            aria-invalid={!cancelReason.trim()}
            aria-describedby={!cancelReason.trim() ? 'booking-cancel-reason-help' : undefined}
          />
          {!cancelReason.trim() && (
            <p id="booking-cancel-reason-help" className="text-xs font-medium text-red-600">
              Vui lòng nhập lý do để tiếp tục.
            </p>
          )}

          {cancelAction === 'DISPUTE' && (
            <div className="pt-2">
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Hình ảnh minh chứng (không bắt buộc)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    setDisputeFiles(Array.from(e.target.files));
                  }
                }}
                className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-action-blue/10 file:text-action-blue hover:file:bg-action-blue/20 transition-colors"
              />
              {disputeFiles.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2 font-medium">
                  Đã chọn {disputeFiles.length} tệp
                </p>
              )}
            </div>
          )}

          <DialogFooter className="mt-4 pt-4 border-t border-white/5">
            <Button
              onClick={() => {
                if (cancelAction === 'REJECT') {
                  handleAction(
                    () => bookingsApi.rejectQuote(booking.id, cancelReason.trim()),
                    'Đã từ chối báo giá',
                  );
                } else if (cancelAction === 'DISPUTE') {
                  const fd = new FormData();
                  fd.append('reason', cancelReason.trim());
                  disputeFiles.forEach((file) => fd.append('images', file));
                  handleAction(
                    () => bookingsApi.dispute(booking.id, fd),
                    'Đã gửi khiếu nại',
                  );
                } else {
                  handleAction(
                    () => bookingsApi.cancel(booking.id, cancelReason.trim()),
                    'Đã hủy đơn',
                  );
                }
                setCancelAction(null);
                setDisputeFiles([]);
              }}
              disabled={!cancelReason.trim() || actionLoading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              size="sm"
            >
              {cancelDialogCopy.confirm}
            </Button>
            <Button
              onClick={() => {
                setCancelAction(null);
                setDisputeFiles([]);
              }}
              variant="outline"
              size="sm"
            >
              Đóng
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

