'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/features/auth/services/auth.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { AuthMessage, AuthShell } from '../_components/AuthShell';
import { PasswordStrength } from '../_components/PasswordStrength';
import { getAuthErrorMessage } from '../_components/auth-utils';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthShell
          title="Đặt lại mật khẩu"
          description="Đang chuẩn bị form đặt lại mật khẩu."
        >
          <AuthMessage type="info">Đang tải…</AuthMessage>
        </AuthShell>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const canSubmit =
    Boolean(token) &&
    newPassword.length >= 6 &&
    confirmPassword.length >= 6 &&
    newPassword === confirmPassword;

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      description="Tạo mật khẩu mới an toàn để tiếp tục sử dụng HomeServe."
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
            Link đặt lại mật khẩu không hợp lệ. Vui lòng kiểm tra lại email hoặc yêu cầu liên kết mới.
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
              className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 pr-12 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
              placeholder="Tối thiểu 6 ký tự"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword((v) => !v)}
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-blue transition-colors hover:text-midnight-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <PasswordStrength password={newPassword} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="font-semibold text-midnight-indigo">
            Xác nhận mật khẩu mới
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              aria-label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 pr-12 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-blue transition-colors hover:text-midnight-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            >
              {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {error && <AuthMessage>{error}</AuthMessage>}

        <Button
          type="submit"
          disabled={loading || !canSubmit}
          className="h-12 w-full rounded-xl bg-action-blue text-base font-semibold text-white shadow-[var(--brand-shadow-button)] transition-[background-color,transform] hover:bg-glacier-blue active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
        </Button>
      </form>
    </AuthShell>
  );
}

