'use client';

import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { StaffAccount, StaffFormErrors } from '../types/staff.types';

interface StaffFormModalProps {
  isOpen: boolean;
  editingStaff: StaffAccount | null;
  formLoading: boolean;
  formName: string;
  setFormName: (val: string) => void;
  formEmail: string;
  setFormEmail: (val: string) => void;
  formPhone: string;
  setFormPhone: (val: string) => void;
  formPassword: string;
  setFormPassword: (val: string) => void;
  formErrors: StaffFormErrors;
  validateField: (name: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function StaffFormModal({
  isOpen,
  editingStaff,
  formLoading,
  formName,
  setFormName,
  formEmail,
  setFormEmail,
  formPhone,
  setFormPhone,
  formPassword,
  setFormPassword,
  formErrors,
  validateField,
  onSubmit,
  onClose,
}: StaffFormModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="w-full max-w-md p-0 overflow-hidden border border-slate-200 bg-white">
        <DialogHeader className="px-6 py-4 border-b border-slate-100 pr-12">
          <DialogTitle className="text-lg font-bold text-slate-800">
            {editingStaff ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400 mt-0.5">
            {editingStaff
              ? `ID: ${editingStaff.id}`
              : 'Nhân viên mới sẽ có vai trò STAFF'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Họ Tên *
            </label>
            <Input
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                validateField('fullName', e.target.value);
              }}
              placeholder="Nguyễn Văn A"
              className={`rounded-xl h-10 ${
                formErrors.fullName ? 'border-red-400' : 'border-slate-200'
              }`}
            />
            {formErrors.fullName && (
              <p className="text-red-500 text-[10px] mt-1">
                {formErrors.fullName}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Email *
            </label>
            <Input
              value={formEmail}
              onChange={(e) => {
                setFormEmail(e.target.value);
                validateField('email', e.target.value);
              }}
              placeholder="email@zup.vn"
              type="email"
              disabled={!!editingStaff}
              className={`rounded-xl h-10 ${
                formErrors.email ? 'border-red-400' : 'border-slate-200'
              }`}
            />
            {formErrors.email && (
              <p className="text-red-500 text-[10px] mt-1">
                {formErrors.email}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Số Điện Thoại
            </label>
            <Input
              value={formPhone}
              onChange={(e) => {
                setFormPhone(e.target.value);
                validateField('phone', e.target.value);
              }}
              placeholder="09xxxxxxxx"
              className={`rounded-xl h-10 ${
                formErrors.phone ? 'border-red-400' : 'border-slate-200'
              }`}
            />
            {formErrors.phone && (
              <p className="text-red-500 text-[10px] mt-1">
                {formErrors.phone}
              </p>
            )}
          </div>

          {!editingStaff && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Mật khẩu ban đầu *
              </label>
              <Input
                value={formPassword}
                onChange={(e) => {
                  setFormPassword(e.target.value);
                  validateField('password', e.target.value);
                }}
                placeholder="Ít nhất 6 ký tự"
                type="password"
                className={`rounded-xl h-10 ${
                  formErrors.password ? 'border-red-400' : 'border-slate-200'
                }`}
              />
              {formErrors.password && (
                <p className="text-red-500 text-[10px] mt-1">
                  {formErrors.password}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={formLoading || Object.keys(formErrors).length > 0}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white"
            >
              {formLoading && (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              )}
              {editingStaff ? 'Cập nhật' : 'Thêm nhân viên'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

