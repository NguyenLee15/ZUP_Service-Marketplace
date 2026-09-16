'use client';

import React, { useRef, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

interface RegisterOtpStepProps {
  email: string;
  otp: string;
  setOtp: (val: string) => void;
  loading: boolean;
  resending?: boolean;
  error: string;
  countdown: number;
  onVerify: () => void;
  onBack: () => void;
  onResend: () => void;
}

export function RegisterOtpStep({
  email,
  otp,
  setOtp,
  loading,
  resending = false,
  error,
  countdown,
  onVerify,
  onBack,
  onResend,
}: RegisterOtpStepProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleVerify = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!loading && otp.length === 6) {
      onVerify();
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        Mã xác thực gồm 6 chữ số đã được gửi tới{' '}
        <span className="font-semibold text-sky-600 dark:text-sky-400">{email}</span>. Mã có hiệu lực trong 10 phút.
      </div>

      <div className="flex flex-col items-center justify-center py-2">
        <label htmlFor="register-otp-input" className="sr-only">
          Mã xác thực OTP gồm 6 chữ số
        </label>
        <InputOTP
          id="register-otp-input"
          aria-label="Mã xác thực OTP gồm 6 chữ số"
          maxLength={6}
          value={otp}
          disabled={loading}
          onChange={(val) => {
            setOtp(val);
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
            if (val.length === 6 && !loading) {
              timerRef.current = setTimeout(() => {
                onVerify();
              }, 120);
            }
          }}
          autoFocus
        >
          <InputOTPGroup className="gap-2 sm:gap-2.5">
            <InputOTPSlot
              index={0}
              className="size-11 sm:size-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-bold text-slate-900 dark:text-slate-100 shadow-xs focus:border-sky-500 transition-colors motion-reduce:transition-none"
            />
            <InputOTPSlot
              index={1}
              className="size-11 sm:size-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-bold text-slate-900 dark:text-slate-100 shadow-xs focus:border-sky-500 transition-colors motion-reduce:transition-none"
            />
            <InputOTPSlot
              index={2}
              className="size-11 sm:size-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-bold text-slate-900 dark:text-slate-100 shadow-xs focus:border-sky-500 transition-colors motion-reduce:transition-none"
            />
            <InputOTPSlot
              index={3}
              className="size-11 sm:size-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-bold text-slate-900 dark:text-slate-100 shadow-xs focus:border-sky-500 transition-colors motion-reduce:transition-none"
            />
            <InputOTPSlot
              index={4}
              className="size-11 sm:size-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-bold text-slate-900 dark:text-slate-100 shadow-xs focus:border-sky-500 transition-colors motion-reduce:transition-none"
            />
            <InputOTPSlot
              index={5}
              className="size-11 sm:size-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-bold text-slate-900 dark:text-slate-100 shadow-xs focus:border-sky-500 transition-colors motion-reduce:transition-none"
            />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-medium text-center"
        >
          {error}
        </div>
      )}

      <Button
        type="button"
        onClick={handleVerify}
        disabled={otp.length !== 6 || loading}
        className="h-11 w-full rounded-xl bg-sky-600 hover:bg-sky-500 text-sm sm:text-base font-semibold text-white shadow-sm transition-colors active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" />
            Đang xác thực…
          </span>
        ) : (
          'Xác thực & Hoàn tất'
        )}
      </Button>

      <div className="flex flex-col items-center justify-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 sm:flex-row sm:justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] items-center gap-1.5 px-2 font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          <ArrowLeft className="size-4" />
          Đổi thông tin
        </button>

        {countdown > 0 ? (
          <span className="inline-flex min-h-[44px] items-center text-slate-600 dark:text-slate-400">
            Gửi lại sau <span className="font-mono font-bold text-sky-600 dark:text-sky-400 ml-1">{countdown}s</span>
          </span>
        ) : (
          <button
            type="button"
            disabled={resending}
            onClick={onResend}
            className="inline-flex min-h-[44px] items-center gap-1.5 px-2 font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 disabled:opacity-50 transition-colors cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            {resending && <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" />}
            <span>{resending ? 'Đang gửi…' : 'Gửi lại mã OTP'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
