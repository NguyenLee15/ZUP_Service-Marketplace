'use client';

import React from 'react';
import {
  X,
  Loader2,
  Settings2,
  Users,
  Shield,
  ShieldCheck,
  ListChecks,
  Gavel,
  FolderTree,
  Wallet,
  Percent,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StaffAccount, AdminPermissionGroup } from '../types/staff.types';

interface StaffPermissionsModalProps {
  isOpen: boolean;
  staff: StaffAccount | null;
  permState: Record<string, boolean>;
  permSaving: boolean;
  permissionGroups: AdminPermissionGroup[];
  onTogglePerm: (key: string, value: boolean) => void;
  onToggleGroup: (group: AdminPermissionGroup, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onSave: () => void;
  onClose: () => void;
}

const PERMISSION_GROUP_VISUALS: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  'Người dùng': { icon: Users, color: 'text-sky-600', bgColor: 'bg-sky-50' },
  'Nhân viên': { icon: Shield, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  KYC: { icon: ShieldCheck, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'Đơn hàng': { icon: ListChecks, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  'Khiếu nại': { icon: Gavel, color: 'text-rose-600', bgColor: 'bg-rose-50' },
  'Dịch vụ': { icon: FolderTree, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  Ví: { icon: Wallet, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  'Tài chính': { icon: Percent, color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'Cài đặt & Audit': { icon: Settings2, color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

export function StaffPermissionsModal({
  isOpen,
  staff,
  permState,
  permSaving,
  permissionGroups,
  onTogglePerm,
  onToggleGroup,
  onToggleAll,
  onSave,
  onClose,
}: StaffPermissionsModalProps) {
  if (!isOpen || !staff) return null;

  const activePermsCount = Object.values(permState).filter(Boolean).length;
  const totalPermsCount = permissionGroups.reduce(
    (acc, group) => acc + group.permissions.length,
    0,
  );
  const isAllSelected = activePermsCount > 0 && activePermsCount === totalPermsCount;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-purple-600" />
              Phân quyền chi tiết
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Cấp quyền truy cập module cho{' '}
              <strong className="text-slate-600">{staff.fullName}</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] font-bold">
              {activePermsCount}/{totalPermsCount} quyền
            </Badge>
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Chọn nhanh quyền hạn
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onToggleAll(!isAllSelected)}
              className="h-7 text-xs rounded-lg gap-1.5"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              {isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
          </div>
        </div>

        {/* Permission Groups Grid */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissionGroups.map((group) => {
              const visuals = PERMISSION_GROUP_VISUALS[group.group] || {
                icon: Shield,
                color: 'text-slate-600',
                bgColor: 'bg-slate-100',
              };
              const Icon = visuals.icon;
              const isGroupAllSelected = group.permissions.every(
                (p) => permState[p.value],
              );
              const isGroupPartiallySelected =
                !isGroupAllSelected &&
                group.permissions.some((p) => permState[p.value]);

              return (
                <div
                  key={group.group}
                  className={`rounded-xl border p-4 transition-all ${
                    isGroupAllSelected || isGroupPartiallySelected
                      ? 'border-purple-200 bg-purple-50/20 shadow-xs'
                      : 'border-slate-200 bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200/60">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg ${visuals.bgColor} flex items-center justify-center`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${visuals.color}`} />
                      </div>
                      <h4 className="font-bold text-xs uppercase tracking-wide text-slate-800">
                        {group.group}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleGroup(group, !isGroupAllSelected)}
                      className="text-[11px] font-medium text-purple-600 hover:text-purple-700 hover:underline cursor-pointer"
                    >
                      {isGroupAllSelected ? 'Bỏ chọn' : 'Chọn hết'}
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {group.permissions.map((perm) => (
                      <label
                        key={perm.value}
                        className="flex items-start gap-2.5 cursor-pointer group"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(permState[perm.value])}
                          onChange={(e) => onTogglePerm(perm.value, e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <span className="select-none">
                          <span className="block text-xs font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                            {perm.label}
                          </span>
                          {perm.description && (
                            <span className="mt-0.5 block text-[10px] leading-relaxed text-slate-400">
                              {perm.description}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <p className="text-[10px] text-slate-400">
            Thay đổi quyền sẽ có hiệu lực ngay sau khi lưu
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="rounded-xl"
            >
              Hủy bỏ
            </Button>
            <Button
              onClick={onSave}
              disabled={permSaving}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
            >
              {permSaving && (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              )}
              Lưu phân quyền
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

