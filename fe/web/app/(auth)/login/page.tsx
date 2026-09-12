'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '@/features/auth/services/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Role, type User } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { AuthCard } from '../_components/AuthCard';
import { PasswordInputField } from '../_components/PasswordInputField';
import { SocialAuthGroup } from '../_components/SocialAuthGroup';
import { DevAccountDrawer } from '../_components/DevAccountDrawer';
import { type DemoAccount } from '../_components/DemoAccountSelector';
import {
  getAuthErrorCode,
  getAuthErrorMessage,
  type GoogleCredentialResponse,
} from '../_components/auth-utils';

type LoginPayload = {
  accessToken: string;
  refreshToken?: string;
  user: User;
};

function normalizeLoginPayload(payload: unknown): LoginPayload {
  let parsed = payload;
  if (typeof payload === 'string') {
    try {
      parsed = JSON.parse(payload) as unknown;
    } catch {
      throw new Error('Máy chủ phản hồi dữ liệu không hợp lệ. Vui lòng tải lại trang.');
    }
  }
  const root = parsed as { data?: unknown };
  const data = (root?.data && typeof root.data === 'object' ? root.data : parsed) as
    | Partial<LoginPayload>
    | undefined;

  if (
    !data ||
    typeof data.accessToken !== 'string' ||
    !data.user ||
    typeof data.user !== 'object'
  ) {
    throw new Error('Phản hồi đăng nhập không hợp lệ. Vui lòng thử lại.');
  }

  return {
    accessToken: data.accessToken,
    refreshToken: typeof data.refreshToken === 'string' ? data.refreshToken : undefined,
    user: data.user as LoginPayload['user'],
  };
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setTokens, setUser, user, _hasHydrated } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rememberMe, setRememberMe] = useState(true);

  // Auto redirect if already logged in
  useEffect(() => {
    if (_hasHydrated && user) {
      if (user.role === Role.ADMIN || user.role === Role.STAFF) {
        router.replace('/admin/dashboard');
      } else if (user.role === Role.CUSTOMER) {
        router.replace('/');
      }
    }
  }, [_hasHydrated, user, router]);

  const handleSelectDemoAccount = useCallback((account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setFieldErrors({});
    setError('');
  }, []);

  const routeAfterAuth = useCallback(
    (authenticatedUser: { role: Role; fullName?: string }) => {
      toast({
        title: 'Đăng nhập thành công',
        description: `Chào mừng ${authenticatedUser.fullName || 'bạn'} quay trở lại ZUP`,
      });

      switch (authenticatedUser.role) {
        case Role.ADMIN:
        case Role.STAFF:
          router.push('/admin/dashboard');
          break;
        case Role.PROVIDER:
          useAuthStore.getState().logout();
          toast({
            title: 'Từ chối truy cập trên trình duyệt',
            description: 'Tài khoản Thợ vui lòng đăng nhập trên ứng dụng di động ZUP Thợ.',
            variant: 'destructive',
          });
          break;
        default:
          router.push('/');
      }
    },
    [router, toast]
  );

  const handleGoogleSuccess = useCallback(
    async (response: GoogleCredentialResponse) => {
      setLoading(true);
      setError('');
      try {
        const res = await authApi.googleAuth(response.credential);
        const { accessToken, refreshToken, user: authUser } = normalizeLoginPayload(res.data);

        setTokens(accessToken, refreshToken);
        setUser(authUser);
        routeAfterAuth(authUser);
      } catch (err: unknown) {
        setError(getAuthErrorMessage(err, 'Đăng nhập Google thất bại. Vui lòng thử lại.'));
      } finally {
        setLoading(false);
      }
    },
    [routeAfterAuth, setTokens, setUser]
  );

  const validate = (name: string, value: string) => {
    const newErrors = { ...fieldErrors };
    if (name === 'email') {
      if (!value.trim()) newErrors.email = 'Email không được để trống';
      else if (!/\S+@\S+\.\S+/.test(value.trim())) newErrors.email = 'Email không đúng định dạng';
      else delete newErrors.email;
    }
    if (name === 'password') {
      if (!value) newErrors.password = 'Mật khẩu không được để trống';
      else if (value.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      else delete newErrors.password;
    }
    setFieldErrors(newErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = 'Email không được để trống';
    else if (!/\S+@\S+\.\S+/.test(email.trim())) errors.email = 'Email không đúng định dạng';

    if (!password) errors.password = 'Mật khẩu không được để trống';
    else if (password.length < 6) errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({ email: email.trim(), password });
      const { accessToken, refreshToken, user: authUser } = normalizeLoginPayload(res.data);

      setTokens(accessToken, refreshToken);
      setUser(authUser);
      routeAfterAuth(authUser);
    } catch (err: unknown) {
      const code = getAuthErrorCode(err);
      const message = getAuthErrorMessage(err, 'Email hoặc mật khẩu không chính xác');

      if (code === 'ACCOUNT_LOCKED') {
        setError('Tài khoản đã bị tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau 15 phút.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthCard
        title="Đăng nhập ZUP"
        description="Chào mừng bạn quay lại. Đăng nhập để tiếp tục quản lý lịch hẹn và dịch vụ."
      >
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              Địa chỉ Email
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
                onChange={(e) => {
                  setEmail(e.target.value);
                  validate('email', e.target.value);
                }}
                className={`h-11 pl-9.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus-visible:ring-sky-500 ${
                  fieldErrors.email ? 'border-rose-500 focus-visible:ring-rose-400' : ''
                }`}
                autoComplete="email"
                spellCheck={false}
                autoFocus
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-rose-500 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password input */}
          <PasswordInputField
            id="password"
            label="Mật khẩu"
            placeholder="Nhập mật khẩu của bạn"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              validate('password', e.target.value);
            }}
            error={fieldErrors.password}
            autoComplete="current-password"
          />

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
              />
              <label
                htmlFor="rememberMe"
                className="text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer select-none"
              >
                Ghi nhớ đăng nhập
              </label>
            </div>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-sky-600 hover:bg-sky-500 text-sm sm:text-base font-semibold text-white shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang đăng nhập…
              </span>
            ) : (
              'Đăng nhập'
            )}
          </Button>

          {/* Google SSO */}
          <SocialAuthGroup
            mode="signin"
            disabled={loading}
            onGoogleSuccess={handleGoogleSuccess}
            onError={(msg) => setError(msg)}
          />

          {/* Register switch link */}
          <div className="pt-2 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Chưa có tài khoản ZUP?{' '}
            <Link
              href="/register"
              className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors"
            >
              Đăng ký ngay
            </Link>
          </div>
        </form>
      </AuthCard>

      {/* Floating dev account selector for test convenience */}
      <DevAccountDrawer
        currentEmail={email}
        onSelectAccount={handleSelectDemoAccount}
      />
    </>
  );
}
