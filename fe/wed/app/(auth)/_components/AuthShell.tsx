'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { CheckCircle2, Home, ShieldCheck, Wrench } from 'lucide-react';
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
  eyebrow = 'HomeServe',
  title,
  description,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-slate-950 text-white relative overflow-hidden flex items-center justify-center py-6 sm:py-12">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-sky-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 mx-auto grid min-h-[620px] w-full max-w-6xl items-stretch gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_480px] lg:px-8">
        
        {/* Left Side: Inspiration Section */}
        <section className="hidden min-h-[620px] flex-col justify-between rounded-[24px] glass-panel p-10 shadow-2xl relative overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-teal-500/5 to-transparent z-0" />
          
          <Link
            href="/"
            className="relative z-10 inline-flex w-fit items-center gap-3 rounded-full text-white transition-all hover:scale-105 active:scale-95 duration-200"
            aria-label="Về trang chủ HomeServe"
          >
            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white shadow-lg shadow-sky-500/20">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Home<span className="text-sky-400">Serve</span></span>
          </Link>

          <div className="relative z-10 max-w-xl space-y-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2 text-sm font-semibold text-sky-400">
              <ShieldCheck className="size-4 text-sky-400" />
              Nền tảng dịch vụ tại gia cao cấp
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-normal text-white">
                Đăng nhập nhanh, đặt dịch vụ gọn hơn.
              </h1>
              <p className="max-w-lg text-base leading-relaxed text-slate-300">
                Quản lý lịch hẹn, theo dõi thợ di chuyển thời gian thực và lưu trữ dịch vụ yêu thích trong một tài khoản thống nhất.
              </p>
            </div>

            <div className="grid gap-3">
              {trustItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md px-4 py-3 text-sm font-medium text-slate-200"
                >
                  <CheckCircle2 className="size-5 text-teal-400 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3">
            <AuthMetric value="24/7" label="Hỗ trợ" />
            <AuthMetric value="OTP" label="Bảo mật" />
            <AuthMetric value="Realtime" label="Theo dõi" />
          </div>
        </section>

        {/* Right Side: Form Container */}
        <div className="mx-auto w-full max-w-[480px] flex flex-col justify-center">
          <div className="mb-6 flex justify-center lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-full text-white transition-all hover:scale-105 active:scale-95 duration-200"
              aria-label="Về trang chủ HomeServe"
            >
              <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-600 to-teal-500 text-white">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Home<span className="text-sky-400">Serve</span></span>
            </Link>
          </div>

          <Card
            className={cn(
              'glass-panel glow-hover gap-0 rounded-[24px] border-white/10 py-0 shadow-2xl text-white relative overflow-hidden',
              className,
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/5 to-transparent z-0 pointer-events-none" />
            
            <CardHeader className="relative z-10 space-y-3 px-6 pb-4 pt-7 text-center sm:px-8">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-sky-400">
                <Home className="size-6" />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-sky-400">{eyebrow}</p>
                <CardTitle className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                  {title}
                </CardTitle>
                <CardDescription className="mx-auto max-w-sm text-sm leading-relaxed text-slate-400">
                  {description}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="relative z-10 px-6 pb-7 sm:px-8">{children}</CardContent>
          </Card>

          {footer && (
            <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>
          )}
        </div>
      </div>
    </main>
  );
}

function AuthMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md p-4 text-center">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-400">{label}</div>
    </div>
  );
}

export function AuthDivider({ label = 'hoặc' }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-white/10" />
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="bg-slate-900 border border-white/10 px-3 py-1 rounded-full text-slate-400 text-xs font-semibold">{label}</span>
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
    error: 'border-red-900/30 bg-red-950/40 text-red-400',
    success: 'border-emerald-900/30 bg-emerald-950/40 text-emerald-400',
    info: 'border-white/10 bg-white/5 text-slate-300',
  }[type];

  return (
    <div
      className={cn('rounded-2xl border px-4 py-3 text-sm leading-6 backdrop-blur-md', tone, className)}
      aria-live="polite"
    >
      {children}
    </div>
  );
}
