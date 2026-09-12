'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Phone, Mail, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '@/features/auth/services/auth.api';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { AuthCard } from '../_components/AuthCard';
import { PasswordInputField } from '../_components/PasswordInputField';
import { PasswordStrength } from '../_components/PasswordStrength';
import { RegisterOtpStep } from '../_components/RegisterOtpStep';
import { SocialAuthGroup } from '../_components/SocialAuthGroup';
import {
  getAuthErrorMessage,
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

  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const validate = (name: string, value: string, nextPassword = password) => {
    const newErrors = { ...fieldErrors };
    if (name === 'fullName') {
      if (!value.trim()) newErrors.fullName = 'Họ và tên không được để trống';
      else if (value.trim().length < 2) newErrors.fullName = 'Họ và tên quá ngắn';
      else delete newErrors.fullName;
    }
    if (name === 'email') {
      if (!value.trim()) newErrors.email = 'Email không được để trống';
      else if (!/\S+@\S+\.\S+/.test(value.trim())) newErrors.email = 'Email không hợp lệ';
      else delete newErrors.email;
    }
    if (name === 'phone') {
      if (!value.trim()) newErrors.phone = 'Số điện thoại không được để trống';
      else if (!/^0\d{9}$/.test(value.trim()))
        newErrors.phone = 'Số điện thoại gồm 10 chữ số bắt đầu bằng 0';
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
    if (!fullName.trim()) errors.fullName = 'Họ và tên không được để trống';
    else if (fullName.trim().length < 2) errors.fullName = 'Họ và tên quá ngắn';

    if (!email.trim()) errors.email = 'Email không được để trống';
    else if (!/\S+@\S+\.\S+/.test(email.trim())) errors.email = 'Email không hợp lệ';

    if (!phone.trim()) errors.phone = 'Số điện thoại không được để trống';
    else if (!/^0\d{9}$/.test(phone.trim()))
      errors.phone = 'Số điện thoại gồm 10 chữ số bắt đầu bằng 0';

    if (!password) errors.password = 'Mật khẩu không được để trống';
    else if (password.length < 6) errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';

    if (password !== confirmPassword)
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';

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
        description: `Vui lòng kiểm tra hòm thư ${email.trim()}`,
      });
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Đăng ký không thành công. Vui lòng thử lại.'));
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
          description: `Chào mừng ${data.user.fullName || 'bạn'} đến với ZUP!`,
        });
        router.push('/');
      } else {
        toast({
          title: 'Xác thực thành công',
          description: 'Vui lòng đăng nhập vào tài khoản của bạn.',
        });
        router.push('/login');
      }
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err, 'Mã OTP không chính xác hoặc đã hết hạn.'));
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
      setError(getAuthErrorMessage(err, 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.'));
    }
  };

  const handleGoogleSuccess = useCallback(
    async (response: GoogleCredentialResponse) => {
      setLoading(true);
      setError('');
      try {
        const res = await authApi.googleAuth(response.credential);
        const data = res.data?.data;
        const authUser = data?.user;
        const accessToken = data?.accessToken;
        const refreshToken = data?.refreshToken;

        if (accessToken && authUser) {
          setTokens(accessToken, refreshToken || '');
          setUser(authUser);
          toast({
            title: 'Đăng ký Google thành công',
            description: `Chào mừng ${authUser.fullName || 'bạn'} đến với ZUP!`,
          });

          if (authUser.role === Role.PROVIDER) {
            useAuthStore.getState().logout();
            toast({
              title: 'Từ chối truy cập trên trình duyệt',
              description: 'Tài khoản Thợ vui lòng đăng nhập trên ứng dụng di động ZUP Thợ.',
              variant: 'destructive',
            });
          } else {
            router.push('/');
          }
        }
      } catch (err: unknown) {
        setError(getAuthErrorMessage(err, 'Đăng ký Google thất bại. Vui lòng thử lại.'));
      } finally {
        setLoading(false);
      }
    },
    [router, setTokens, setUser, toast]
  );

  return (
    <AuthCard
      title={step === 'form' ? 'Tạo tài khoản ZUP' : 'Xác thực Email'}
      description={
        step === 'form'
          ? 'Đăng ký để đặt lịch thợ tận tâm và theo dõi dịch vụ tại nhà dễ dàng.'
          : `Nhập mã 6 chữ số vừa được gửi đến ${email}.`
      }
    >
      {step === 'form' ? (
        <form onSubmit={handleRegister} className="space-y-4" noValidate>
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name & Phone in 2-column layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                Họ và tên
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    validate('fullName', e.target.value);
                  }}
                  className={`h-11 pl-9.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus-visible:ring-sky-500 ${
                    fieldErrors.fullName ? 'border-rose-500' : ''
                  }`}
                  autoComplete="name"
                  required
                />
              </div>
              {fieldErrors.fullName && (
                <p className="text-xs text-rose-500 font-medium">{fieldErrors.fullName}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                Số điện thoại
              </Label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <Phone className="w-4 h-4" />
                </div>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="0912345678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    validate('phone', e.target.value);
                  }}
                  className={`h-11 pl-9.5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus-visible:ring-sky-500 ${
                    fieldErrors.phone ? 'border-rose-500' : ''
                  }`}
                  autoComplete="tel"
                  required
                />
              </div>
              {fieldErrors.phone && (
                <p className="text-xs text-rose-500 font-medium">{fieldErrors.phone}</p>
              )}
            </div>
          </div>

          {/* Email */}
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
                  fieldErrors.email ? 'border-rose-500' : ''
                }`}
                autoComplete="email"
                required
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-rose-500 font-medium">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password with Strength indicator */}
          <div className="space-y-1.5">
            <PasswordInputField
              id="password"
              label="Mật khẩu"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validate('password', e.target.value);
              }}
              error={fieldErrors.password}
              autoComplete="new-password"
            />
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <PasswordInputField
            id="confirmPassword"
            label="Xác nhận mật khẩu"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              validate('confirmPassword', e.target.value);
            }}
            error={fieldErrors.confirmPassword}
            autoComplete="new-password"
          />

          {/* Submit */}
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-xl bg-sky-600 hover:bg-sky-500 text-sm sm:text-base font-semibold text-white shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang xử lý…
              </span>
            ) : (
              'Tạo tài khoản ZUP'
            )}
          </Button>

          {/* Google SSO */}
          <SocialAuthGroup
            mode="signup"
            disabled={loading}
            onGoogleSuccess={handleGoogleSuccess}
            onError={(msg) => setError(msg)}
          />

          {/* Terms notice */}
          <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500 text-center">
            Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư của ZUP.
          </p>

          {/* Login switch link */}
          <div className="pt-2 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Đã có tài khoản ZUP?{' '}
            <Link
              href="/login"
              className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </div>
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
    </AuthCard>
  );
}
