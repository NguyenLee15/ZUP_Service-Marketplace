'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { AuthMessage } from './AuthShell';

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
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-sm leading-6 text-slate-300 backdrop-blur-md">
        Mã xác thực gồm 6 chữ số đã được gửi tới <span className="font-semibold text-cyan-300">{email}</span>. Mã có hiệu lực trong 10 phút.
      </div>

      <div className="flex justify-center py-2">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          autoFocus
        >
          <InputOTPGroup className="gap-2 sm:gap-2.5">
            <InputOTPSlot index={0} className="size-12 rounded-xl border-white/15 bg-white/5 text-lg font-bold text-white shadow-xs focus:border-action-blue" />
            <InputOTPSlot index={1} className="size-12 rounded-xl border-white/15 bg-white/5 text-lg font-bold text-white shadow-xs focus:border-action-blue" />
            <InputOTPSlot index={2} className="size-12 rounded-xl border-white/15 bg-white/5 text-lg font-bold text-white shadow-xs focus:border-action-blue" />
            <InputOTPSlot index={3} className="size-12 rounded-xl border-white/15 bg-white/5 text-lg font-bold text-white shadow-xs focus:border-action-blue" />
            <InputOTPSlot index={4} className="size-12 rounded-xl border-white/15 bg-white/5 text-lg font-bold text-white shadow-xs focus:border-action-blue" />
            <InputOTPSlot index={5} className="size-12 rounded-xl border-white/15 bg-white/5 text-lg font-bold text-white shadow-xs focus:border-action-blue" />
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && <AuthMessage className="text-center">{error}</AuthMessage>}

      <Button
        type="button"
        onClick={onVerify}
        disabled={otp.length !== 6 || loading}
        className="h-12 w-full rounded-xl bg-action-blue text-base font-semibold text-white shadow-[var(--brand-shadow-button)] transition-[background-color,transform] hover:bg-glacier-blue active:scale-[0.99] disabled:opacity-50"
      >
        {loading ? 'Đang xác thực…' : 'Xác thực & Hoàn tất'}
      </Button>

      <div className="flex flex-col items-center justify-center gap-3 text-sm text-slate-400 sm:flex-row sm:justify-between pt-1">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1 font-semibold text-action-blue transition-colors hover:text-glacier-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
        >
          <ArrowLeft className="size-4" />
          Đổi thông tin
        </button>

        {countdown > 0 ? (
          <span>
            Gửi lại sau <span className="font-mono font-bold text-cyan-300">{countdown}s</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            className="font-semibold text-action-blue transition-colors hover:text-glacier-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
          >
            Gửi lại mã OTP
          </button>
        )}
      </div>
    </div>
  );
}

