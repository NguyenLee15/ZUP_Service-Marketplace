'use client';

import { useState, useEffect } from 'react';
import { Sparkles, User, Briefcase, ShieldCheck, X } from 'lucide-react';
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

interface DevAccountDrawerProps {
  onSelectAccount: (account: DemoAccount) => void;
  onFastLogin?: (account: DemoAccount) => Promise<void>;
  currentEmail?: string;
  isLoggingIn?: boolean;
}

export function DevAccountDrawer({
  onSelectAccount,
  onFastLogin,
  currentEmail,
  isLoggingIn = false,
}: DevAccountDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Demo credentials are intentionally public; deployments can opt out.
  if (process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === 'false') {
    return null;
  }

  const handleFastLoginClick = async (account: DemoAccount) => {
    if (isLoggingIn || loadingKey) return;
    setLoadingKey(account.key);
    try {
      if (onFastLogin) {
        await onFastLogin(account);
      } else {
        onSelectAccount(account);
        setIsOpen(false);
      }
    } catch {
      // Error handled by parent
    } finally {
      setLoadingKey(null);
    }
  };

  const handleFillOnly = (e: React.MouseEvent, account: DemoAccount) => {
    e.stopPropagation();
    onSelectAccount(account);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div 
          role="dialog"
          aria-label="Tài khoản Demo Hội đồng & Tuyển dụng"
          className="w-88 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-base">🔑</span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  Tài khoản Demo Đồ án
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Dành cho Hội đồng &amp; Tuyển dụng (1-Click Login)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng bảng tài khoản demo"
              className="size-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const isCurrent = acc.email === currentEmail;
              const isCurrentLoading = loadingKey === acc.key && isLoggingIn;
              const Icon = acc.icon;

              return (
                <div
                  key={acc.key}
                  className={cn(
                    'p-2.5 rounded-xl border transition-all',
                    isCurrent
                      ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={cn(
                          'size-7 rounded-lg flex items-center justify-center shrink-0',
                          isCurrent
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {acc.label}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                            {acc.badgeLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          {acc.email}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleFillOnly(e, acc)}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline underline-offset-2 shrink-0 cursor-pointer pt-0.5"
                    >
                      Điền form
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1.5 leading-snug">
                    {acc.roleDescription}
                  </p>

                  <button
                    type="button"
                    disabled={isLoggingIn}
                    onClick={() => handleFastLoginClick(acc)}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    {isCurrentLoading ? (
                      <>
                        <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang đăng nhập…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>1-Click Đăng nhập ngay</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 text-center leading-relaxed">
            💡 Tài khoản <span className="font-semibold text-slate-700 dark:text-slate-300">Thợ đối tác</span> đăng nhập trực tiếp qua ứng dụng di động <span className="font-medium text-sky-600 dark:text-sky-400">ZUP Thợ (Expo App)</span>.
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-sky-300 dark:border-sky-800 bg-white/95 dark:bg-slate-900/95 text-sky-700 dark:text-sky-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:bg-sky-50/80 dark:hover:bg-slate-800 text-xs font-bold transition-all active:scale-95 cursor-pointer"
        >
          <span className="text-sm">🔑</span>
          <span>Tài khoản Demo (Tuyển dụng &amp; Hội đồng)</span>
        </button>
      )}
    </div>
  );
}
