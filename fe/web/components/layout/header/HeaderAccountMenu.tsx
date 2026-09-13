'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

interface HeaderAccountMenuProps {
  isAdminOrStaff: boolean;
}

export function HeaderAccountMenu({ isAdminOrStaff }: HeaderAccountMenuProps) {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const { user, logout: storeLogout } = useAuthStore();
  const router = useRouter();

  const displayName = user?.fullName?.trim() || user?.email || 'Tài khoản';
  const userInitial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    if (!accountMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountMenuOpen]);

  const handleLogout = async () => {
    try {
      const { authApi } = await import('@/features/auth/services/auth.api');
      await authApi.logout();
    } catch {}
    storeLogout();
    router.push('/login');
  };

  return (
    <div ref={accountMenuRef} className="relative hidden lg:block">
      <button
        type="button"
        aria-label="Menu tài khoản"
        aria-haspopup="menu"
        aria-expanded={accountMenuOpen}
        onClick={() => setAccountMenuOpen((open) => !open)}
        className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold text-white">
          {userInitial}
        </span>
        <span className="max-w-28 xl:max-w-36 truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
          {displayName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
            accountMenuOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {accountMenuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-60 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="space-y-0.5 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Tài khoản ZUP
            </p>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {displayName}
            </p>
            {user?.email && user?.fullName && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user.email}
              </p>
            )}
          </div>
          <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
          {isAdminOrStaff && (
            <>
              <Link
                href="/admin/dashboard"
                prefetch={false}
                role="menuitem"
                onClick={() => setAccountMenuOpen(false)}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Trang quản trị (Admin)
              </Link>
              <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />
            </>
          )}
          <Link
            href="/profile"
            prefetch={false}
            role="menuitem"
            onClick={() => setAccountMenuOpen(false)}
            className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-slate-400" />
            Hồ sơ cá nhân
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAccountMenuOpen(false);
              void handleLogout();
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

