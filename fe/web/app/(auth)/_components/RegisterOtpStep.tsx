'use client';

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
  error,
  countdown,
  onVerify,
  onBack,
  onResend,
}: RegisterOtpStepProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        Mã xác thực gồm 6 chữ số đã được gửi tới{' '}
        <span className="font-semibold text-sky-600 dark:text-sky-400">{email}</span>. Mã có hiệu lực trong 10 phút.
      </div>

      <div className="flex justify-center py-2">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(val) => {
            setOtp(val);
            if (val.length === 6 && !loading) {
              // Trigger verify automatically
              setTimeout(() => onVerify(), 50);
            }
          }}
          autoFocus
        >
          <InputOTPGroup className="gap-2 sm:gap-2.5">
            <InputOTPSlot
              index={0}
              className="size-11 sm:size-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-bold text-slate-900 dark:text-slate-100 shadow-xs focus:border-sky-500"
            />
            <InputOTPSlot
              index={1}
              className="size-11 sm:size-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-bold text-slate-900 dark:text-slate-100 shadow-xs focus:border-sky-500"
            />
            <InputOTPSlot
              index={2}
              className="size-11 sm:size-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-bold text-slate-900 dark:text-slate-100 shadow-xs focus:border-sky-500"
            />
            <InputOTPSlot
              index={3}
              className="size-11 sm:size-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-bold text-slate-900 dark:text-slate-100 shadow-xs focus:border-sky-500"
            />
            <InputOTPSlot
              index={4}
              className="size-11 sm:size-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-bold text-slate-900 dark:text-slate-100 shadow-xs focus:border-sky-500"
            />
            <InputOTPSlot
              index={5}
              className="size-11 sm:size-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-bold text-slate-900 dark:text-slate-100 shadow-xs focus:border-sky-500"
            />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs sm:text-sm text-rose-600 dark:text-rose-400 font-medium text-center">
          {error}
        </div>
      )}

      <Button
        type="button"
        onClick={onVerify}
        disabled={otp.length !== 6 || loading}
        className="h-11 w-full rounded-xl bg-sky-600 hover:bg-sky-500 text-sm sm:text-base font-semibold text-white shadow-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang xác thực…
          </span>
        ) : (
          'Xác thực & Hoàn tất'
        )}
      </Button>

      <div className="flex flex-col items-center justify-center gap-3 text-xs sm:text-sm text-slate-500 sm:flex-row sm:justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors cursor-pointer"
        >
          <ArrowLeft className="size-4" />
          Đổi thông tin
        </button>

        {countdown > 0 ? (
          <span className="text-slate-500">
            Gửi lại sau <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{countdown}s</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors cursor-pointer"
          >
            Gửi lại mã OTP
          </button>
        )}
      </div>
    </div>
  );
}
