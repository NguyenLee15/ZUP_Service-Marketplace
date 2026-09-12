'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/features/auth/services/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Role, type User } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { AuthDivider, AuthMessage, AuthShell } from '../_components/AuthShell';
import { DemoAccountSelector, type DemoAccount } from '../_components/DemoAccountSelector';
import {
  getAuthErrorCode,
  getAuthErrorMessage,
  getGoogleIdentity,
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
      throw new Error('Server đăng nhập trả về dữ liệu không hợp lệ. Vui lòng thử lại sau khi tải lại trang.');
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
    throw new Error('Phản hồi đăng nhập không hợp lệ. Vui lòng tải lại trang và thử lại.');
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

  const [email, setEmail] = useState('customer@demo.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [gsiReady, setGsiReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

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

  useEffect(() => {
    if (getGoogleIdentity()) {
      setGsiReady(true);
    }
  }, []);

  const routeAfterAuth = useCallback(
    (user: { role: Role; fullName?: string }) => {
      toast({
        title: 'Đăng nhập thành công',
        description: `Xin chào ${user.fullName || 'bạn'}`,
      });

      switch (user.role) {
        case Role.ADMIN:
        case Role.STAFF:
          router.push('/admin/dashboard');
          break;
        case Role.PROVIDER:
          useAuthStore.getState().logout();
          toast({
            title: 'Từ chối truy cập',
            description: 'Vui lòng sử dụng Mobile App dành cho Thợ.',
            variant: 'destructive',
          });
          break;
        default:
          router.push('/');
      }
    },
    [router, toast],
  );

  const handleGoogleResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      setLoading(true);
      setError('');
      try {
        const res = await authApi.googleAuth(response.credential);
        const { accessToken, refreshToken, user } = normalizeLoginPayload(res.data);

        setTokens(accessToken, refreshToken);
        setUser(user);
        routeAfterAuth(user);
      } catch (err: unknown) {
        setError(getAuthErrorMessage(err, 'Đăng nhập Google thất bại'));
      } finally {
        setLoading(false);
      }
    },
    [routeAfterAuth, setTokens, setUser],
  );

  const handleGoogleFallbackClick = useCallback(() => {
    if (!googleClientId) {
      setError('Chưa cấu hình đăng nhập Google. Vui lòng đăng nhập bằng email.');
      return;
    }

    const google = getGoogleIdentity();
    if (!google) {
      setError('Google chưa tải xong. Vui lòng thử lại sau vài giây.');
      return;
    }

    try {
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse,
      });
      google.accounts.id.prompt();
    } catch {
      setError('Không thể mở đăng nhập Google. Vui lòng thử email và mật khẩu.');
    }
  }, [googleClientId, handleGoogleResponse]);

  useEffect(() => {
    const google = getGoogleIdentity();
    if (!gsiReady || !googleBtnRef.current || !google) return;

    if (!googleClientId) {
      return;
    }

    const timer = setTimeout(() => {
      if (!googleBtnRef.current) return;
      try {
        googleBtnRef.current.innerHTML = '';
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
        });
        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: googleBtnRef.current.offsetWidth || 360,
          text: 'signin_with',
          shape: 'rectangular',
        });
      } catch {
        setError('Không thể tải đăng nhập Google. Vui lòng thử email và mật khẩu.');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [gsiReady, googleClientId, handleGoogleResponse]);

  const validate = (name: string, value: string) => {
    const newErrors = { ...fieldErrors };
    if (name === 'email') {
      if (!value) newErrors.email = 'Email không được để trống';
      else if (!/\S+@\S+\.\S+/.test(value)) newErrors.email = 'Email không hợp lệ';
      else delete newErrors.email;
    }
    if (name === 'password') {
      if (!value) newErrors.password = 'Mật khẩu không được để trống';
      else if (value.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      else delete newErrors.password;
    }
    setFieldErrors(newErrors);
  };

  const getLoginErrors = () => {
    const errors: Record<string, string> = {};
    if (!email.trim()) errors.email = 'Email không được để trống';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email không hợp lệ';

    if (!password) errors.password = 'Mật khẩu không được để trống';
    else if (password.length < 6) errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';

    return errors;
  };

  const focusFirstError = (errors: Record<string, string>) => {
    const firstField = Object.keys(errors)[0];
    if (!firstField) return;
    window.setTimeout(() => document.getElementById(firstField)?.focus(), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errors = getLoginErrors();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstError(errors);
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.login({ email, password });
      const { accessToken, refreshToken, user } = normalizeLoginPayload(res.data);

      setTokens(accessToken, refreshToken);
      setUser(user);
      routeAfterAuth(user);
    } catch (err: unknown) {
      const code = getAuthErrorCode(err);
      const message = getAuthErrorMessage(err, 'Đã xảy ra lỗi. Vui lòng thử lại.');

      if (code === 'ACCOUNT_LOCKED') {
        setError('Tài khoản tạm khóa do nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.');
      } else if (code === 'UNAUTHORIZED') {
        setError(message || 'Email hoặc mật khẩu không chính xác');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      description="Tiếp tục quản lý lịch hẹn, địa chỉ và dịch vụ yêu thích của bạn."
      footer={
        <>
          Chưa có tài khoản?{' '}
          <Link
            href="/register"
            className="font-semibold text-action-blue transition-colors hover:text-glacier-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-4 focus-visible:ring-offset-cloud-mist"
          >
            Đăng ký
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Bộ chọn tài khoản Demo theo vai trò */}
        <DemoAccountSelector
          onSelectAccount={handleSelectDemoAccount}
          currentEmail={email}
        />

        <div className="space-y-2">
          <Label htmlFor="email" className="font-semibold text-midnight-indigo">
            Email / Tên đăng nhập *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            aria-label="Email"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validate('email', e.target.value);
            }}
            className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
            autoComplete="email"
            spellCheck={false}
          />
          {fieldErrors.email && (
            <p id="email-error" className="text-xs font-medium text-red-600">
              {fieldErrors.email}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="password" className="font-semibold text-midnight-indigo">
              Mật khẩu *
            </Label>
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-action-blue transition-colors hover:text-glacier-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-4 focus-visible:ring-offset-white"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              aria-label="Mật khẩu"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validate('password', e.target.value);
              }}
              className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 pr-11 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-blue transition-colors hover:text-midnight-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className="text-xs font-medium text-red-600">
              {fieldErrors.password}
            </p>
          )}
        </div>

        {/* Checkbox Ghi nhớ đăng nhập */}
        <div className="flex items-center space-x-2 pt-1">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
          />
          <label
            htmlFor="remember-me"
            className="text-xs font-medium text-slate-300 cursor-pointer select-none"
          >
            Ghi nhớ đăng nhập
          </label>
        </div>

        {error && <AuthMessage>{error}</AuthMessage>}

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-action-blue text-base font-semibold text-white shadow-[var(--brand-shadow-button)] transition-[background-color,transform] hover:bg-glacier-blue flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Đang đăng nhập…
            </span>
          ) : (
            'Đăng nhập'
          )}
        </Button>

        <AuthDivider />

        <div
          ref={googleBtnRef}
          id="google-login-btn"
          className="flex min-h-12 w-full items-center justify-center rounded-xl overflow-hidden"
          aria-label="Đăng nhập bằng Google"
        >
          <button
            type="button"
            onClick={handleGoogleFallbackClick}
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-white px-4 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:bg-slate-100 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
          >
            <svg className="size-4.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
            </svg>
            <span>{googleClientId ? 'Đăng nhập với Google' : 'Google chưa được cấu hình'}</span>
          </button>
        </div>
        {!googleClientId && (
          <p className="text-center text-xs leading-5 text-slate-blue">
            Hiện có thể đăng nhập bằng email. Google sẽ bật sau khi cấu hình OAuth.
          </p>
        )}

        <p className="text-center text-xs leading-5 text-slate-blue">
          Thông tin đăng nhập được bảo vệ theo phiên làm việc của bạn.
        </p>
      </form>

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setGsiReady(true)}
      />
    </AuthShell>
  );
}
