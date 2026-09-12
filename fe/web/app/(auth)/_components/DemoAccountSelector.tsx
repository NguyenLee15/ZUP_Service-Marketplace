'use client';

import { useState } from 'react';
import { User, ShieldCheck, Briefcase, Sparkles, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DemoRoleKey = 'customer' | 'staff' | 'admin';

export interface DemoAccount {
  key: DemoRoleKey;
  label: string;
  badgeLabel: string;
  email: string;
  password: string;
  name: string;
  roleDescription: string;
  icon: typeof User;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    key: 'customer',
    label: 'Khách hàng',
    badgeLabel: 'Customer',
    email: 'customer@demo.com',
    password: 'password123',
    name: 'Nguyễn Văn Khách',
    roleDescription: 'Đặt dịch vụ, duyệt báo giá & theo dõi thợ',
    icon: User,
  },
  {
    key: 'staff',
    label: 'Nhân viên',
    badgeLabel: 'Staff',
    email: 'staff@demo.com',
    password: 'password123',
    name: 'Nhân viên điều phối',
    roleDescription: 'Quản lý đơn hàng, điều phối & xử lý tranh chấp',
    icon: Briefcase,
  },
  {
    key: 'admin',
    label: 'Quản trị viên',
    badgeLabel: 'Admin',
    email: 'admin@system.com',
    password: 'password123',
    name: 'Quản trị hệ thống',
    roleDescription: 'Cấu hình hệ thống, duyệt KYC & xem logs',
    icon: ShieldCheck,
  },
];

interface DemoAccountSelectorProps {
  onSelectAccount: (account: DemoAccount) => void;
  currentEmail?: string;
  className?: string;
}

export function DemoAccountSelector({
  onSelectAccount,
  currentEmail,
  className,
}: DemoAccountSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSelectRole = (account: DemoAccount) => {
    onSelectAccount(account);
    setCopiedKey(account.key);
    setTimeout(() => {
      setCopiedKey(null);
      setIsOpen(false);
    }, 600);
  };

  return (
    <div className={cn('rounded-xl border border-white/10 bg-slate-900/40 backdrop-blur-md overflow-hidden transition-all', className)}>
      {/* Toggle Bar */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs text-slate-300 transition-colors hover:text-white hover:bg-white/5"
      >
        <span className="flex items-center gap-2 font-medium">
          <Sparkles className="size-3.5 text-cyan-400" />
          <span>Tài khoản thử nghiệm nhanh (Demo)</span>
        </span>
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <span>{isOpen ? 'Thu gọn' : 'Chọn vai trò'}</span>
          {isOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </div>
      </button>

      {/* Expandable Role List */}
      {isOpen && (
        <div className="border-t border-white/10 p-2.5 space-y-1.5 bg-slate-950/50">
          <div className="grid grid-cols-3 gap-1.5 pb-1">
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = acc.email === currentEmail;
              const Icon = acc.icon;
              return (
                <button
                  key={acc.key}
                  type="button"
                  onClick={() => handleSelectRole(acc)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all',
                    isSelected
                      ? 'bg-action-blue text-white shadow-sm'
                      : 'border border-white/5 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white',
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  <span className="truncate">{acc.label}</span>
                </button>
              );
            })}
          </div>

          <div className="space-y-1 pt-1">
            {DEMO_ACCOUNTS.map((acc) => {
              const isSelected = acc.email === currentEmail;
              return (
                <button
                  key={`detail-${acc.key}`}
                  type="button"
                  onClick={() => handleSelectRole(acc)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[11px] transition-colors',
                    isSelected
                      ? 'border border-cyan-500/30 bg-cyan-950/30 text-slate-200'
                      : 'border border-transparent hover:border-white/10 hover:bg-white/5 text-slate-400',
                  )}
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <span className="font-semibold text-slate-200">{acc.name}</span>
                    <span className="text-slate-500 font-mono ml-1.5">({acc.email})</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1">
                    {copiedKey === acc.key ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium">
                        <Check className="size-3" />
                        Đã điền
                      </span>
                    ) : (
                      <span className="text-cyan-400 font-medium">Điền</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[10.5px] text-slate-400 text-center pt-1 italic">
            * Thợ đối tác đăng nhập trên ứng dụng HomeServe Mobile.
          </p>
        </div>
      )}
    </div>
  );
}
