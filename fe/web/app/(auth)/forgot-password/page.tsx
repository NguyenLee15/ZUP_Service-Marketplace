'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/features/auth/services/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthMessage, AuthShell } from '../_components/AuthShell';

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
    <AuthShell
      title="Quên mật khẩu"
      description="Nhập email tài khoản để nhận hướng dẫn đặt lại mật khẩu HomeServe."
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-semibold text-action-blue transition-colors hover:text-glacier-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-4 focus-visible:ring-offset-cloud-mist"
        >
          <ArrowLeft className="size-4" />
          Quay lại đăng nhập
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-6 py-2 text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="size-8 text-emerald-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-midnight-indigo">Kiểm tra hộp thư của bạn</h2>
            <p className="text-sm leading-6 text-slate-blue">
              Nếu email <span className="font-semibold text-midnight-indigo">{email}</span> tồn tại trong hệ thống HomeServe, link đặt lại mật khẩu sẽ được gửi trong vài phút.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-xl border-platinum-tint bg-white/5 text-midnight-indigo transition-colors hover:bg-pale-gray/50"
          >
            <Link href="/login">Quay lại trang đăng nhập</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleForgotSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email" className="font-semibold text-midnight-indigo">
              Email đăng ký
            </Label>
            <div className="relative">
              <Input
                id="email"
                name="email"
                type="email"
                aria-label="Email đăng ký"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 pr-11 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
                placeholder="you@example.com"
                autoComplete="email"
                spellCheck={false}
                required
              />
              <Mail className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-blue" />
            </div>
          </div>

          {error && <AuthMessage>{error}</AuthMessage>}

          <Button
            type="submit"
            disabled={!email.includes('@') || loading}
            className="h-12 w-full rounded-xl bg-action-blue text-base font-semibold text-white shadow-[var(--brand-shadow-button)] transition-[background-color,transform] hover:bg-glacier-blue active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Đang gửi…' : 'Gửi link đặt lại mật khẩu'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
