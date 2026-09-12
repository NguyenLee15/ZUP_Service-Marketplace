'use client';

import { useState } from 'react';
import { Sparkles, User, Briefcase, ShieldCheck, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_ACCOUNTS, type DemoAccount } from './DemoAccountSelector';

interface DevAccountDrawerProps {
  onSelectAccount: (account: DemoAccount) => void;
  currentEmail?: string;
}

export function DevAccountDrawer({ onSelectAccount, currentEmail }: DevAccountDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // In production builds, we can hide or keep minimal
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleSelect = (account: DemoAccount) => {
    onSelectAccount(account);
    setSelectedKey(account.key);
    setTimeout(() => {
      setSelectedKey(null);
      setIsOpen(false);
    }, 400);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="w-80 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-3.5 space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-slate-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Tài khoản thử nghiệm nhanh (Dev)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="size-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const isCurrent = acc.email === currentEmail;
              const isPicked = selectedKey === acc.key;
              const Icon = acc.icon;

              return (
                <button
                  key={acc.key}
                  type="button"
                  onClick={() => handleSelect(acc)}
                  className={cn(
                    'w-full flex items-center justify-between p-2 rounded-xl text-left transition-all text-xs cursor-pointer',
                    isCurrent
                      ? 'bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                      'size-7 rounded-lg flex items-center justify-center shrink-0',
                      isCurrent
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    )}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {acc.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {acc.email}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    {isPicked ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                        <Check className="w-3 h-3" />
                        Đã điền
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400">
                        Chọn
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-1 border-t border-slate-100 dark:border-slate-800">
            * Thợ đối tác đăng nhập trên ứng dụng di động ZUP Thợ.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-md text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Demo Accounts</span>
        </button>
      )}
    </div>
  );
}
