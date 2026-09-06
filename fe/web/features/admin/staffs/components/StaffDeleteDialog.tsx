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
import { StaffAccount } from '../types/staff.types';

interface StaffDeleteDialogProps {
  staff: StaffAccount | null;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function StaffDeleteDialog({
  staff,
  loading,
  onConfirm,
  onClose,
}: StaffDeleteDialogProps) {
  return (
    <Dialog open={Boolean(staff)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md rounded-2xl p-6">
        <DialogHeader className="gap-2">
          <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 mb-1">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900">
            Xác nhận xóa nhân viên
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Bạn có chắc chắn muốn xóa tài khoản nhân viên{' '}
            <strong className="text-slate-700">{staff?.fullName}</strong> (
            {staff?.email})? Thao tác này sẽ thu hồi toàn bộ quyền và vô hiệu hóa tài khoản.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl"
          >
            Hủy bỏ
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Xác nhận xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

