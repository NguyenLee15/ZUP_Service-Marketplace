'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { CheckCircle2, Home, ShieldCheck } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

type AuthShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

const trustItems = [
  'Lịch hẹn rõ ràng, dễ theo dõi',
  'Thông tin tài khoản được bảo vệ',
  'Kết nối nhanh với dịch vụ tại nhà',
];

export function AuthShell({
  eyebrow = 'HomeService',
  title,
  description,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-cloud-mist text-midnight-indigo">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_480px] lg:px-8">
        <section className="hidden min-h-[620px] flex-col justify-between rounded-[20px] border border-platinum-tint/80 bg-warm-canvas p-10 shadow-[var(--brand-shadow-sm)] lg:flex">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-3 rounded-full text-midnight-indigo transition-colors hover:text-action-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-4 focus-visible:ring-offset-warm-canvas"
            aria-label="Về trang chủ HomeService"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-action-blue text-lg font-bold text-white shadow-[var(--brand-shadow-button)]">
              H
            </span>
            <span className="text-lg font-bold">HomeService</span>
          </Link>

          <div className="max-w-xl space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-platinum-tint bg-white/70 px-4 py-2 text-sm font-semibold text-slate-blue">
              <ShieldCheck className="size-4 text-action-blue" />
              Nền tảng dịch vụ tại nhà
            </div>
            <div className="space-y-4">
              <h1 className="text-5xl font-bold leading-[1.05] tracking-normal text-midnight-indigo">
                Đăng nhập nhanh, đặt dịch vụ gọn hơn.
              </h1>
              <p className="max-w-lg text-base leading-7 text-slate-blue">
                Quản lý lịch hẹn, địa chỉ và dịch vụ yêu thích trong một tài khoản
                thống nhất.
              </p>
            </div>

            <div className="grid gap-3">
              {trustItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-platinum-tint/70 bg-white/75 px-4 py-3 text-sm font-medium text-midnight-indigo"
                >
                  <CheckCircle2 className="size-5 text-action-blue" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <AuthMetric value="24/7" label="Hỗ trợ" />
            <AuthMetric value="OTP" label="Xác thực" />
            <AuthMetric value="1 nơi" label="Quản lý" />
          </div>
        </section>

        <div className="mx-auto w-full max-w-[480px]">
          <div className="mb-6 flex justify-center lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full text-midnight-indigo transition-colors hover:text-action-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-4 focus-visible:ring-offset-cloud-mist"
              aria-label="Về trang chủ HomeService"
            >
              <span className="flex size-10 items-center justify-center rounded-2xl bg-action-blue text-base font-bold text-white">
                H
              </span>
              <span className="font-bold">HomeService</span>
            </Link>
          </div>

          <Card
            className={cn(
              'surface-card-elevated gap-0 rounded-[20px] border-platinum-tint/80 bg-white py-0 shadow-[var(--brand-shadow-card)]',
              className,
            )}
          >
            <CardHeader className="space-y-3 px-6 pb-4 pt-7 text-center sm:px-8">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-pale-gray text-action-blue">
                <Home className="size-6" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-action-blue">{eyebrow}</p>
                <CardTitle className="text-2xl font-bold leading-tight text-midnight-indigo sm:text-3xl">
                  {title}
                </CardTitle>
                <CardDescription className="mx-auto max-w-sm text-sm leading-6 text-slate-blue">
                  {description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-7 sm:px-8">{children}</CardContent>
          </Card>

          {footer && (
            <div className="mt-6 text-center text-sm text-slate-blue">{footer}</div>
          )}
        </div>
      </div>
    </main>
  );
}

function AuthMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-platinum-tint/70 bg-white/70 p-4">
      <div className="text-xl font-bold text-midnight-indigo">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-blue">{label}</div>
    </div>
  );
}

export function AuthDivider({ label = 'hoặc' }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-platinum-tint" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-white px-3 font-semibold text-slate-blue">{label}</span>
      </div>
    </div>
  );
}

export function AuthMessage({
  type = 'error',
  children,
  className,
}: {
  type?: 'error' | 'success' | 'info';
  children: ReactNode;
  className?: string;
}) {
  const tone = {
    error: 'border-red-200 bg-red-50 text-red-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    info: 'border-platinum-tint bg-pale-gray text-slate-blue',
  }[type];

  return (
    <div
      className={cn('rounded-2xl border px-4 py-3 text-sm leading-6', tone, className)}
      aria-live="polite"
    >
      {children}
    </div>
  );
}
