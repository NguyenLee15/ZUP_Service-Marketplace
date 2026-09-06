'use client';

import { useState } from 'react';
import { User, ShieldCheck, Briefcase, Wrench, Sparkles, Check, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DemoRoleKey = 'customer' | 'staff' | 'admin' | 'provider';

export interface DemoAccount {
  key: DemoRoleKey;
  label: string;
  badgeLabel: string;
  email: string;
  password: string;
  name: string;
  roleDescription: string;
  icon: typeof User;
  activeColor: string;
  tagColor: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    key: 'customer',
    label: 'Khách Hàng',
    badgeLabel: 'Customer',
    email: 'customer@demo.com',
    password: 'password123',
    name: 'Nguyễn Văn Khách',
    roleDescription: 'Đặt dịch vụ, duyệt báo giá, chat thợ & đánh giá',
    icon: User,
    activeColor: 'from-blue-600 to-indigo-600 text-white shadow-blue-500/25',
    tagColor: 'text-sky-300',
  },
  {
    key: 'staff',
    label: 'Nhân Viên',
    badgeLabel: 'Staff',
    email: 'staff@demo.com',
    password: 'password123',
    name: 'Nhân Viên Điều Phối Demo',
    roleDescription: 'Xử lý đơn hàng, điều phối thợ & giải quyết tranh chấp',
    icon: Briefcase,
    activeColor: 'from-purple-600 to-indigo-600 text-white shadow-purple-500/25',
    tagColor: 'text-purple-300',
  },
  {
    key: 'admin',
    label: 'Quản Trị Viên',
    badgeLabel: 'Admin',
    email: 'admin@system.com',
    password: 'password123',
    name: 'Quản Trị Viên Hệ Thống',
    roleDescription: 'Toàn quyền cấu hình hệ thống, duyệt KYC & xem logs',
    icon: ShieldCheck,
    activeColor: 'from-emerald-600 to-teal-600 text-white shadow-emerald-500/25',
    tagColor: 'text-emerald-300',
  },
  {
    key: 'provider',
    label: 'Thợ Dịch Vụ',
    badgeLabel: 'Provider',
    email: 'provider1@demo.com',
    password: 'password123',
    name: 'Nguyễn Đức Cường (Điện Lạnh)',
    roleDescription: 'Nhận đơn, gửi báo giá (Ưu tiên dùng trên Mobile App)',
    icon: Wrench,
    activeColor: 'from-amber-600 to-orange-600 text-white shadow-amber-500/25',
    tagColor: 'text-amber-300',
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
  const [selectedKey, setSelectedKey] = useState<DemoRoleKey>(() => {
    const found = DEMO_ACCOUNTS.find((acc) => acc.email === currentEmail);
    return found ? found.key : 'customer';
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const currentAccount =
    DEMO_ACCOUNTS.find((acc) => acc.key === selectedKey) || DEMO_ACCOUNTS[0];

  const handleSelectRole = (account: DemoAccount) => {
    setSelectedKey(account.key);
    onSelectAccount(account);
    setCopiedKey(account.key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  return (
    <div className={cn('space-y-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3.5 backdrop-blur-md', className)}>
      {/* Header Label */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="flex items-center gap-1.5 uppercase tracking-wider text-slate-400">
          <Sparkles className="size-3.5 text-cyan-400" />
          Chọn vai trò đăng nhập
        </span>
        <span className="text-[11px] font-normal text-cyan-400">
          Tự động điền tài khoản
        </span>
      </div>

      {/* Role Selection Tabs */}
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {DEMO_ACCOUNTS.map((acc) => {
          const isSelected = selectedKey === acc.key;
          const Icon = acc.icon;
          return (
            <button
              key={acc.key}
              type="button"
              onClick={() => handleSelectRole(acc)}
              className={cn(
                'group relative flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-2 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400',
                isSelected
                  ? cn('bg-gradient-to-r shadow-md', acc.activeColor)
                  : 'border border-white/5 bg-white/5 text-slate-300 hover:border-white/15 hover:bg-white/10 hover:text-white',
              )}
            >
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate">{acc.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick Fill Banner Card */}
      <button
        type="button"
        onClick={() => handleSelectRole(currentAccount)}
        title="Nhấn để tự động điền tài khoản này"
        className="group relative flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2.5 text-left text-xs transition-all duration-200 hover:border-cyan-500/40 hover:bg-slate-950/90 active:scale-[0.99]"
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            <span className="font-semibold text-slate-400">Demo:</span>
            <span className={cn('font-bold', currentAccount.tagColor)}>
              {currentAccount.email.split('@')[0]}
            </span>
            <span className="text-slate-500">/</span>
            <span className="font-semibold text-emerald-400">
              {currentAccount.password}
            </span>
            <span className="truncate text-slate-400 font-sans font-normal">
              ({currentAccount.name})
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans line-clamp-1">
            {currentAccount.roleDescription}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-1 text-[11px] font-medium text-cyan-400 group-hover:text-cyan-300">
          {copiedKey === currentAccount.key ? (
            <>
              <Check className="size-3.5 text-emerald-400" />
              <span className="text-emerald-400">Đã điền!</span>
            </>
          ) : (
            <>
              <span>Điền ngay</span>
              <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </div>
      </button>
    </div>
  );
}
