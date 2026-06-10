'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/features/auth/services/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { AuthDivider, AuthMessage, AuthShell } from '../_components/AuthShell';
import { PasswordStrength } from '../_components/PasswordStrength';
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

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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
    if (!fullName.trim()) errors.fullName = 'Họ tên không được để trống';
    else if (fullName.trim().length < 2) errors.fullName = 'Họ tên quá ngắn';

    if (!email.trim()) errors.email = 'Email không được để trống';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email không hợp lệ';

    if (!phone.trim()) errors.phone = 'Số điện thoại không được để trống';
    else if (!/^0\d{9}$/.test(phone.trim())) errors.phone = 'Số điện thoại phải là 10 chữ số bắt đầu bằng 0';

    if (!password) errors.password = 'Mật khẩu không được để trống';
    else if (password.length < 6) errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';

    if (!confirmPassword) errors.confirmPassword = 'Vui lòng nhập lại mật khẩu';
    else if (password !== confirmPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp';

    return errors;
  };

  const focusFirstError = (errors: Record<string, string>) => {
    const firstField = Object.keys(errors)[0];
    if (!firstField) return;
    window.setTimeout(() => document.getElementById(firstField)?.focus(), 0);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const errors = getRegisterErrors();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      focusFirstError(errors);
      return;
    }

    setLoading(true);
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
      toast({ title: 'Đã gửi OTP', description: 'Vui lòng kiểm tra email của bạn.' });
      window.setTimeout(() => otpRefs.current[0]?.focus(), 80);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Đăng ký thất bại'));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((digit, digitIndex) => {
        if (index + digitIndex < 6) newOtp[index + digitIndex] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return;

    setLoading(true);
    setError('');
    try {
      const res = await authApi.verifyOtp({ email, otp: otpCode });
      const { accessToken, refreshToken, user } = res.data.data;

      setTokens(accessToken, refreshToken);
      setUser(user);
      toast({ title: 'Xác thực thành công' });

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
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Mã OTP không chính xác'));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError('');
    try {
      await authApi.resendOtp(email);
      setCountdown(60);
      toast({ title: 'Đã gửi lại OTP' });
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Không thể gửi lại OTP'));
    }
  };

  const handleGoogleResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      setLoading(true);
      setError('');
      try {
        const res = await authApi.googleAuth(response.credential);
        const { accessToken, refreshToken, user } = res.data.data;

        setTokens(accessToken, refreshToken);
        setUser(user);
        toast({
          title: 'Đăng ký thành công',
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
        <form onSubmit={handleRegister} className="space-y-5" noValidate>
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
              spellCheck={false}
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
              inputMode="tel"
              aria-label="Số điện thoại"
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                validate('phone', e.target.value);
              }}
              className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
              placeholder="0901234567"
              autoComplete="tel"
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
            <PasswordStrength password={password} />
            {fieldErrors.password && (
              <p id="password-error" className="text-xs font-medium text-red-600">
                {fieldErrors.password}
              </p>
            )}
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
                aria-describedby={
                  fieldErrors.confirmPassword ? 'confirmPassword-error' : undefined
                }
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  validate('confirmPassword', e.target.value);
                }}
                className="h-12 rounded-xl border-platinum-tint bg-cloud-mist/70 px-4 pr-11 text-midnight-indigo placeholder:text-slate-blue transition-[color,box-shadow,border-color] focus-visible:border-action-blue"
                placeholder="Nhập lại mật khẩu"
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
            className="h-12 w-full rounded-xl bg-action-blue text-base font-semibold text-white shadow-[var(--brand-shadow-button)] transition-colors hover:bg-glacier-blue"
          >
            {loading ? 'Đang xử lý…' : 'Đăng ký'}
          </Button>

          <AuthDivider />

          <div
            ref={googleBtnRef}
            id="google-register-btn"
            className="flex min-h-11 w-full items-center justify-center rounded-xl border border-platinum-tint bg-white"
            aria-label="Đăng ký bằng Google"
          >
            <button
              type="button"
              onClick={handleGoogleFallbackClick}
              className="flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-midnight-indigo transition-colors hover:bg-pale-gray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
            >
              {googleClientId ? 'Đăng ký với Google' : 'Google chưa được cấu hình'}
            </button>
          </div>
          {!googleClientId && (
            <p className="text-center text-xs leading-5 text-slate-blue">
              Hiện có thể đăng ký bằng email. Google sẽ bật sau khi cấu hình OAuth.
            </p>
          )}

          <p className="text-center text-xs leading-5 text-slate-blue">
            Bằng việc đăng ký, bạn đồng ý với điều khoản dịch vụ của Zup.
          </p>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-platinum-tint bg-cloud-mist/70 px-4 py-3 text-sm leading-6 text-slate-blue">
            Mã OTP có hiệu lực trong 10 phút. Nếu nhập sai quá nhiều lần, bạn cần gửi
            lại mã mới.
          </div>

          <div className="flex justify-center gap-2" role="group" aria-label="Mã OTP 6 chữ số">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  otpRefs.current[index] = el;
                }}
                name={`otp-${index + 1}`}
                aria-label={`Số OTP thứ ${index + 1}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="h-14 w-11 rounded-xl border border-platinum-tint bg-cloud-mist/70 text-center text-xl font-bold text-midnight-indigo shadow-xs transition-[color,box-shadow,border-color] focus:border-action-blue focus:outline-none focus:ring-2 focus:ring-action-blue/30 sm:w-12"
              />
            ))}
          </div>

          {error && <AuthMessage className="text-center">{error}</AuthMessage>}

          <Button
            type="button"
            onClick={handleVerifyOtp}
            disabled={otp.join('').length !== 6 || loading}
            className="h-12 w-full rounded-xl bg-action-blue text-base font-semibold text-white shadow-[var(--brand-shadow-button)] transition-colors hover:bg-glacier-blue"
          >
            {loading ? 'Đang xác thực…' : 'Xác thực OTP'}
          </Button>

          <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-blue sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setStep('form');
                setError('');
                setOtp(['', '', '', '', '', '']);
              }}
              className="inline-flex items-center gap-1 font-semibold text-action-blue transition-colors hover:text-glacier-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-4 focus-visible:ring-offset-white"
            >
              <ArrowLeft className="size-4" />
              Đổi email
            </button>

            {countdown > 0 ? (
              <span>
                Gửi lại sau <span className="font-mono font-bold text-midnight-indigo">{countdown}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                className="font-semibold text-action-blue transition-colors hover:text-glacier-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue focus-visible:ring-offset-4 focus-visible:ring-offset-white"
              >
                Gửi lại mã OTP
              </button>
            )}
          </div>
        </div>
      )}

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setGsiReady(true)}
      />
    </AuthShell>
  );
}
