'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/features/auth/services/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { AuthDivider, AuthMessage, AuthShell } from '../_components/AuthShell';
import { PasswordStrength } from '../_components/PasswordStrength';
import { RegisterOtpStep } from '../_components/RegisterOtpStep';
import {
  getAuthErrorMessage,
  getGoogleIdentity,
  type GoogleCredentialResponse,
} from '../_components/auth-utils';

type Step = 'form' | 'otp';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { setTokens, setUser } = useAuthStore();

  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role] = useState<'CUSTOMER'>('CUSTOMER');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  const [gsiReady, setGsiReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((current) => current - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (getGoogleIdentity()) {
      setGsiReady(true);
    }
  }, []);

  const validate = (name: string, value: string, nextPassword = password) => {
    const newErrors = { ...fieldErrors };
    if (name === 'fullName') {
      if (!value) newErrors.fullName = 'Họ tên không được để trống';
      else if (value.trim().length < 2) newErrors.fullName = 'Họ tên quá ngắn';
      else delete newErrors.fullName;
    }
    if (name === 'email') {
      if (!value) newErrors.email = 'Email không được để trống';
      else if (!/\S+@\S+\.\S+/.test(value)) newErrors.email = 'Email không hợp lệ';
      else delete newErrors.email;
    }
    if (name === 'phone') {
      if (!value) newErrors.phone = 'Số điện thoại không được để trống';
      else if (!/^0\d{9}$/.test(value)) newErrors.phone = 'Số điện thoại phải là 10 chữ số bắt đầu bằng 0';
      else delete newErrors.phone;
    }
    if (name === 'password') {
      if (!value) newErrors.password = 'Mật khẩu không được để trống';
      else if (value.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      else delete newErrors.password;

      if (confirmPassword && confirmPassword !== value) {
        newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      } else if (confirmPassword) {
        delete newErrors.confirmPassword;
      }
    }
    if (name === 'confirmPassword') {
      if (value !== nextPassword) newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      else delete newErrors.confirmPassword;
    }
    setFieldErrors(newErrors);
  };

  const getRegisterErrors = () => {
    const errors: Record<string, string> = {};
    if (!fullName) errors.fullName = 'Họ tên không được để trống';
    else if (fullName.trim().length < 2) errors.fullName = 'Họ tên quá ngắn';

    if (!email) errors.email = 'Email không được để trống';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email không hợp lệ';

    if (!phone) errors.phone = 'Số điện thoại không được để trống';
    else if (!/^0\d{9}$/.test(phone)) errors.phone = 'Số điện thoại phải là 10 chữ số bắt đầu bằng 0';

    if (!password) errors.password = 'Mật khẩu không được để trống';
    else if (password.length < 6) errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';

    if (password !== confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    return errors;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = getRegisterErrors();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setError('');
    try {
      await authApi.register({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
      });
      setStep('otp');
      setCountdown(60);
      toast({
        title: 'Mã xác thực đã được gửi',
        description: `Vui lòng kiểm tra hộp thư ${email.trim()}`,
      });
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Đăng ký thất bại'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;

    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyOtp({
        email: email.trim(),
        otp,
      });
      const data = res.data?.data;
      if (data?.accessToken && data?.user) {
        setTokens(data.accessToken, data.refreshToken);
        setUser(data.user);
        toast({
          title: 'Đăng ký thành công',
          description: `Chào mừng ${data.user.fullName || 'bạn'} đến với HomeServe!`,
        });
        router.push('/');
      } else {
        toast({
          title: 'Đăng ký thành công',
          description: 'Vui lòng đăng nhập vào tài khoản của bạn.',
        });
        router.push('/login');
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Xác thực OTP thất bại'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError('');
    try {
      await authApi.resendOtp(email.trim());
      setCountdown(60);
      toast({
        title: 'Đã gửi lại mã OTP',
        description: `Mã mới đã được gửi tới ${email.trim()}`,
      });
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Gửi lại OTP thất bại'));
    }
  };

  const handleGoogleResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        setError('Không nhận được thông tin xác thực từ Google.');
        return;
      }

      setLoading(true);
      setError('');
      try {
        const res = await authApi.googleAuth(response.credential);
        const data = res.data?.data;
        const user = data?.user;
        const accessToken = data?.accessToken;
        const refreshToken = data?.refreshToken;

        if (accessToken && user) {
          setTokens(accessToken, refreshToken || '');
          setUser(user);
          toast({
            title: 'Đăng ký Google thành công',
            description: `Xin chào ${user.fullName || 'bạn'}`,
          });

          if (user.role === Role.PROVIDER) {
            useAuthStore.getState().logout();
            toast({
              title: 'Từ chối truy cập',
              description: 'Vui lòng sử dụng Mobile App dành cho Thợ.',
              variant: 'destructive',
            });
          } else {
            router.push('/');
          }
        }
      } catch (err: unknown) {
        setError(getAuthErrorMessage(err, 'Đăng ký Google thất bại'));
      } finally {
        setLoading(false);
      }
    },
    [router, setTokens, setUser, toast],
  );

  const handleGoogleFallbackClick = useCallback(() => {
    if (!googleClientId) {
      setError('Chưa cấu hình đăng nhập Google. Vui lòng đăng ký bằng email.');
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
      setError('Không thể mở đăng nhập Google. Vui lòng đăng ký bằng email.');
    }
  }, [googleClientId, handleGoogleResponse]);

  useEffect(() => {
    const google = getGoogleIdentity();
    if (!gsiReady || !googleBtnRef.current || !google || !googleClientId) return;

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
          text: 'signup_with',
          shape: 'rectangular',
        });
      } catch {
        setError('Không thể tải đăng nhập Google. Vui lòng đăng ký bằng email.');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [gsiReady, googleClientId, handleGoogleResponse]);

  return (
    <AuthShell
      title={step === 'form' ? 'Đăng ký tài khoản' : 'Xác thực email'}
      description={
        step === 'form'
          ? 'Tạo tài khoản khách hàng để đặt và theo dõi dịch vụ tại nhà.'
          : `Nhập mã 6 số đã gửi đến ${email}.`
      }
      footer={
        <>
          Đã có tài khoản?{' '}
          <Link
            href="/login"
            className="font-semibold text-action-blue transition-colors hover:text-glacier-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-4 focus-visible:ring-offset-cloud-mist"
          >
            Đăng nhập
          </Link>
        </>
      }
    >
      {step === 'form' ? (
        <form onSubmit={handleRegister} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="fullName" className="font-semibold text-midnight-indigo">
              Họ và tên
            </Label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              aria-label="Họ và tên"
              aria-invalid={Boolean(fieldErrors.fullName)}
              aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                validate('fullName', e.target.value);
              }}
              className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
              placeholder="Nguyễn Văn A"
              autoComplete="name"
              required
            />
            {fieldErrors.fullName && (
              <p id="fullName-error" className="text-xs font-medium text-red-600">
                {fieldErrors.fullName}
              </p>
            )}
          </div>

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
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                validate('email', e.target.value);
              }}
              className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            {fieldErrors.email && (
              <p id="email-error" className="text-xs font-medium text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="font-semibold text-midnight-indigo">
              Số điện thoại
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              aria-label="Số điện thoại"
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                validate('phone', e.target.value);
              }}
              className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
              placeholder="0912345678"
              autoComplete="tel"
              required
            />
            {fieldErrors.phone && (
              <p id="phone-error" className="text-xs font-medium text-red-600">
                {fieldErrors.phone}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="font-semibold text-midnight-indigo">
              Mật khẩu
            </Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                aria-label="Mật khẩu"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  validate('password', e.target.value);
                }}
                className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 pr-11 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
                placeholder="Tối thiểu 6 ký tự"
                autoComplete="new-password"
                required
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
            <PasswordStrength password={password} />
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
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  validate('confirmPassword', e.target.value);
                }}
                className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 pr-11 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
                placeholder="Nhập lại mật khẩu"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className="absolute right-2 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-blue transition-colors hover:text-midnight-indigo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p id="confirmPassword-error" className="text-xs font-medium text-red-600">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          {error && <AuthMessage>{error}</AuthMessage>}

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-action-blue text-base font-semibold text-white shadow-[var(--brand-shadow-button)] transition-[background-color,transform] hover:bg-glacier-blue active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Đang xử lý…' : 'Đăng ký'}
          </Button>

          <AuthDivider />

          <div
            ref={googleBtnRef}
            id="google-register-btn"
            className="flex min-h-12 w-full items-center justify-center rounded-xl overflow-hidden"
            aria-label="Đăng ký bằng Google"
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
              <span>{googleClientId ? 'Đăng ký với Google' : 'Google chưa được cấu hình'}</span>
            </button>
          </div>
          {!googleClientId && (
            <p className="text-center text-xs leading-5 text-slate-blue">
              Hiện có thể đăng ký bằng email. Google sẽ bật sau khi cấu hình OAuth.
            </p>
          )}

          <p className="text-center text-xs leading-5 text-slate-blue">
            Bằng việc đăng ký, bạn đồng ý với điều khoản dịch vụ của HomeServe.
          </p>
        </form>
      ) : (
        <RegisterOtpStep
          email={email}
          otp={otp}
          setOtp={setOtp}
          loading={loading}
          error={error}
          countdown={countdown}
          onVerify={handleVerifyOtp}
          onBack={() => {
            setStep('form');
            setError('');
            setOtp('');
          }}
          onResend={handleResendOtp}
        />
      )}

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setGsiReady(true)}
      />
    </AuthShell>
  );
}
