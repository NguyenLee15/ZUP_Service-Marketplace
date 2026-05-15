'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { authApi } from '@/features/auth/services/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { AuthMessage, AuthShell } from '../_components/AuthShell';
import { PasswordStrength } from '../_components/PasswordStrength';
import { getAuthErrorMessage } from '../_components/auth-utils';

export default function ForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Quên mật khẩu"
          description="Đang chuẩn bị form đặt lại mật khẩu."
        >
          <AuthMessage type="info">Đang tải…</AuthMessage>
        </AuthShell>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
}

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const tokenParam = searchParams.get('token');
  const isResetFlow = tokenParam !== null;
  const token = tokenParam || '';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      toast({
        title: 'Đặt lại mật khẩu thành công',
        description: 'Vui lòng đăng nhập lại bằng mật khẩu mới.',
      });
      router.push('/login');
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  if (isResetFlow) {
    const canSubmit =
      Boolean(token) &&
      newPassword.length >= 6 &&
      confirmPassword.length >= 6 &&
      newPassword === confirmPassword;

    return (
      <AuthShell
        title="Đặt lại mật khẩu"
        description="Tạo mật khẩu mới để tiếp tục sử dụng tài khoản HomeService."
        footer={
          <Link
            href="/login"
            className="font-semibold text-action-blue transition-colors hover:text-glacier-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-4 focus-visible:ring-offset-cloud-mist"
          >
            Quay lại đăng nhập
          </Link>
        }
      >
        <form onSubmit={handleResetSubmit} className="space-y-5" noValidate>
          {!token && (
            <AuthMessage>
              Link đặt lại mật khẩu không hợp lệ. Vui lòng yêu cầu link mới.
            </AuthMessage>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="font-semibold text-midnight-indigo">
              Mật khẩu mới
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                aria-label="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 pr-11 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
                placeholder="Tối thiểu 6 ký tự"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label={showNewPassword ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
                className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-blue transition-colors hover:bg-pale-gray hover:text-midnight-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <PasswordStrength password={newPassword} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-semibold text-midnight-indigo">
              Xác nhận mật khẩu
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                aria-label="Xác nhận mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 pr-11 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu xác nhận' : 'Hiện mật khẩu xác nhận'}
                className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-blue transition-colors hover:bg-pale-gray hover:text-midnight-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && <AuthMessage>{error}</AuthMessage>}

          <Button
            type="submit"
            disabled={!canSubmit || loading}
            className="h-12 w-full rounded-xl bg-action-blue text-base font-semibold text-white shadow-[var(--brand-shadow-button)] transition-colors hover:bg-glacier-blue"
          >
            {loading ? 'Đang xử lý…' : 'Đặt lại mật khẩu'}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Quên mật khẩu"
      description="Nhập email tài khoản để nhận link đặt lại mật khẩu."
      footer={
        <Link
          href="/login"
          className="font-semibold text-action-blue transition-colors hover:text-glacier-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-4 focus-visible:ring-offset-cloud-mist"
        >
          Quay lại đăng nhập
        </Link>
      }
    >
      {sent ? (
        <div className="space-y-6 py-2 text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50">
            <Mail className="size-10 text-emerald-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-midnight-indigo">Kiểm tra email của bạn</h2>
            <p className="text-sm leading-6 text-slate-blue">
              Nếu email <span className="font-semibold text-midnight-indigo">{email}</span> tồn
              tại trong hệ thống, link đặt lại mật khẩu sẽ được gửi trong vài phút.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-xl border-platinum-tint bg-white text-midnight-indigo transition-colors hover:bg-pale-gray"
          >
            <Link href="/login">Quay lại đăng nhập</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleForgotSubmit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="email" className="font-semibold text-midnight-indigo">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
              placeholder="you@example.com"
              autoComplete="email"
              spellCheck={false}
              required
            />
          </div>

          {error && <AuthMessage>{error}</AuthMessage>}

          <Button
            type="submit"
            disabled={!email.includes('@') || loading}
            className="h-12 w-full rounded-xl bg-action-blue text-base font-semibold text-white shadow-[var(--brand-shadow-button)] transition-colors hover:bg-glacier-blue"
          >
            {loading ? 'Đang gửi…' : 'Gửi link đặt lại'}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
