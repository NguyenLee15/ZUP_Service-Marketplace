'use client';

import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
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

interface AdminCancelBookingDialogProps {
  open: boolean;
  cancelReason: string;
  actionLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (reason: string) => void;
  onConfirmCancel: () => void;
}

export function AdminCancelBookingDialog({
  open,
  cancelReason,
  actionLoading,
  onOpenChange,
  onReasonChange,
  onConfirmCancel,
}: AdminCancelBookingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md rounded-2xl border-slate-200 shadow-xl">
        <DialogHeader className="border-b border-slate-100 pb-3">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-800">
            <AlertTriangle className="h-5 w-5 text-red-500" /> Hủy đơn hàng này?
          </DialogTitle>
          <DialogDescription>
            Lý do hủy sẽ được lưu vào lịch sử đơn và thông báo cho các bên.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <p className="text-xs leading-relaxed text-slate-500">
            Hành động này sẽ hủy bỏ đơn hàng và thay đổi trạng thái thành{' '}
            <span className="font-bold text-slate-700">CANCELLED</span>. Khách
            hàng và nhà cung cấp sẽ nhận được thông báo.
          </p>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-detail-cancel-reason"
              className="block text-xs font-bold text-slate-700"
            >
              Lý do hủy đơn *
            </label>
            <Textarea
              id="admin-detail-cancel-reason"
              value={cancelReason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Ví dụ: khách hàng yêu cầu hủy vì trùng lịch…"
              rows={3}
              className="resize-none rounded-lg border-slate-200 text-sm focus:border-red-400 focus:ring-red-400/20"
              aria-invalid={!cancelReason.trim()}
              aria-describedby={
                !cancelReason.trim() ? 'admin-detail-cancel-reason-help' : undefined
              }
            />
            {!cancelReason.trim() && (
              <p
                id="admin-detail-cancel-reason-help"
                className="text-xs text-red-600"
              >
                Vui lòng nhập lý do hủy trước khi xác nhận.
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-10 rounded-xl border-slate-200 text-xs font-bold"
            >
              Đóng
            </Button>
            <Button
              onClick={onConfirmCancel}
              disabled={actionLoading || !cancelReason.trim()}
              className="h-10 rounded-xl bg-red-600 text-xs font-bold shadow-lg shadow-red-500/20 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Đang xử lý…
                </>
              ) : (
                'Hủy đơn hàng'
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

