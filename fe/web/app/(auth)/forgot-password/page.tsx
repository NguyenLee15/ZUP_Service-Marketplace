'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '@/features/auth/services/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthCard } from '../_components/AuthCard';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.forgotPassword({ email: email.trim() });
    } catch {
      // Giữ phản hồi an toàn để không tiết lộ email có tồn tại hay không.
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthCard
      title="Quên mật khẩu"
      description={
        sent
          ? 'Hướng dẫn khôi phục mật khẩu đã được gửi.'
          : 'Nhập email tài khoản của bạn để nhận hướng dẫn đặt lại mật khẩu ZUP.'
      }
    >
      {sent ? (
        <div className="space-y-6 py-2 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Kiểm tra hộp thư của bạn
            </h3>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Nếu email <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span> tồn tại trong hệ thống ZUP, liên kết đặt lại mật khẩu sẽ được gửi đến trong vài phút.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-11 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Link href="/login">Quay lại trang đăng nhập</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleForgotSubmit} className="space-y-4" noValidate>
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              Email tài khoản
            </Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 pl-9.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus-visible:ring-sky-500"
                autoComplete="email"
                spellCheck={false}
                required
                autoFocus
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={!email.includes('@') || loading}
            className="h-11 w-full rounded-xl bg-sky-600 hover:bg-sky-500 text-sm sm:text-base font-semibold text-white shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang gửi liên kết…
              </span>
            ) : (
              'Gửi liên kết đặt lại mật khẩu'
            )}
          </Button>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              <ArrowLeft className="size-4" />
              Quay lại đăng nhập
            </Link>
          </div>
        </form>
      )}
    </AuthCard>
  );
}
