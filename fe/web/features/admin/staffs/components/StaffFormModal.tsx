'use client';

import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StaffAccount, StaffFormErrors } from '../types/staff.types';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {editingStaff ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {editingStaff
                ? `ID: ${editingStaff.id}`
                : 'Nhân viên mới sẽ có vai trò STAFF'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng cửa sổ"
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
      </div>
    </div>
  );
}

