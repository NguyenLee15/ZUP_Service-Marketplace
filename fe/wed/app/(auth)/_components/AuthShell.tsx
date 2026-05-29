'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { CheckCircle2, Home, ShieldCheck, Sparkles, Wrench } from 'lucide-react';
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
  eyebrow = 'Zup',
  title,
  description,
  children,
  footer,
  className,
}: AuthShellProps) {
  return (
    <main className="auth-aether min-h-screen text-white relative overflow-hidden flex items-center justify-center">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-sky-600/15 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 grid min-h-screen w-full items-stretch lg:grid-cols-2">
        
        {/* Left Side: Inspiration Section */}
        <section className="hidden flex-col justify-between p-12 shadow-2xl relative overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-[url('/images/hero_bg.webp')] bg-cover bg-center opacity-55" />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/95 via-slate-950/62 to-slate-950/35" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_36%,rgba(6,182,212,0.22),transparent_24rem)]" />
          
          <Link
            href="/"
            className="relative z-10 inline-flex w-fit items-center gap-3 rounded-full text-white transition-all hover:scale-105 active:scale-95 duration-200"
            aria-label="Về trang chủ Zup"
          >
            <img
              src="/logo.png"
              alt="ZUP Logo"
              className="h-10 w-10 rounded-xl object-cover border border-white/10 shadow-lg shadow-sky-500/20 shrink-0"
            />
            <span className="text-2xl font-bold tracking-tight text-white select-none">ZUP</span>
          </Link>

          <div className="relative z-10 max-w-xl space-y-7 rounded-2xl border border-white/10 bg-slate-950/45 p-8 shadow-[0_8px_32px_rgba(2,132,199,0.22)] backdrop-blur-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md px-4 py-2 text-sm font-semibold text-cyan-300">
              <ShieldCheck className="size-4 text-cyan-300" />
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
        <div className="relative flex w-full items-center justify-center overflow-y-auto px-4 py-8 sm:px-8 lg:px-16">
          <div className="absolute right-1/4 top-1/4 h-96 w-96 rounded-full bg-sky-600/10 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="relative z-10 mx-auto w-full max-w-[480px]">
          <div className="mb-6 flex justify-center lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-full text-white transition-all hover:scale-105 active:scale-95 duration-200"
              aria-label="Về trang chủ Zup"
            >
              <img
                src="/logo.png"
                alt="ZUP Logo"
                className="h-9 w-9 rounded-xl object-cover border border-white/10 shrink-0"
              />
              <span className="font-bold text-lg select-none text-white">ZUP</span>
            </Link>
          </div>

          <Card
            className={cn(
              'glass-panel gap-0 rounded-2xl border-white/10 py-0 shadow-xl shadow-black/45 text-white relative overflow-hidden',
              className,
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/5 to-transparent z-0 pointer-events-none" />
            
            <CardHeader className="relative z-10 space-y-3 px-6 pb-4 pt-7 text-center sm:px-8">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-sky-600/15 border border-sky-400/20 text-cyan-300 shrink-0">
                <img
                  src="/logo.png"
                  alt="ZUP"
                  className="size-10 rounded-lg object-cover"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">{eyebrow}</p>
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
      </div>
    </main>
  );
}

function AuthMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-md p-4 text-center">
      <div className="flex items-center justify-center gap-1 text-xl font-bold text-white">
        <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
        {value}
      </div>
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
