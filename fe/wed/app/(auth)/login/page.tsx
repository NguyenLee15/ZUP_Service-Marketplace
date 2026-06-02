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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { AuthDivider, AuthMessage, AuthShell } from '../_components/AuthShell';
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
  const { setTokens, setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const google = getGoogleIdentity();
    if (!gsiReady || !googleBtnRef.current || !google) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Chưa cấu hình đăng nhập Google. Vui lòng đăng nhập bằng email.');
      return;
    }

    const timer = setTimeout(() => {
      if (!googleBtnRef.current) return;
      try {
        google.accounts.id.initialize({
          client_id: clientId,
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
  }, [gsiReady, handleGoogleResponse]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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

  const isValid = email.includes('@') && password.length >= 6;

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
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="font-semibold text-midnight-indigo">
            Email
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
              Mật khẩu
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
              className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-blue transition-colors hover:bg-pale-gray hover:text-midnight-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
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

        {error && <AuthMessage>{error}</AuthMessage>}

        <Button
          type="submit"
          disabled={!isValid || loading || Object.keys(fieldErrors).length > 0}
          className="h-12 w-full rounded-xl bg-action-blue text-base font-semibold text-white shadow-[var(--brand-shadow-button)] transition-colors hover:bg-glacier-blue"
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
          className="flex min-h-11 w-full items-center justify-center"
          aria-label="Đăng nhập bằng Google"
        />

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
