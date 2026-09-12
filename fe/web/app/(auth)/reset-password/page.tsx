'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '@/features/auth/services/auth.api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AuthCard } from '../_components/AuthCard';
import { PasswordInputField } from '../_components/PasswordInputField';
import { PasswordStrength } from '../_components/PasswordStrength';
import { getAuthErrorMessage } from '../_components/auth-utils';

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthCard title="Đặt lại mật khẩu" description="Đang tải dữ liệu…">
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
          </div>
        </AuthCard>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.');
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
        description: 'Vui lòng đăng nhập lại bằng mật khẩu mới của bạn.',
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
    <AuthCard
      title="Đặt lại mật khẩu"
      description="Tạo mật khẩu mới an toàn để tiếp tục sử dụng ZUP."
    >
      <form onSubmit={handleResetSubmit} className="space-y-4" noValidate>
        {!token && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Liên kết đặt lại mật khẩu không hợp lệ. Vui lòng kiểm tra lại email hoặc yêu cầu liên kết mới.
            </span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <PasswordInputField
            id="newPassword"
            label="Mật khẩu mới"
            placeholder="Tối thiểu 6 ký tự"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordStrength password={newPassword} />
        </div>

        <PasswordInputField
          id="confirmPassword"
          label="Xác nhận mật khẩu mới"
          placeholder="Nhập lại mật khẩu mới"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          disabled={loading || !canSubmit}
          className="h-11 w-full rounded-xl bg-sky-600 hover:bg-sky-500 text-sm sm:text-base font-semibold text-white shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang cập nhật…
            </span>
          ) : (
            'Cập nhật mật khẩu'
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
    </AuthCard>
  );
}
