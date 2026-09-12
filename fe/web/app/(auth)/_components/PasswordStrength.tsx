'use client';

import { cn } from '@/lib/utils';

type PasswordStrengthProps = {
  password: string;
};

function getPasswordScore(password: string) {
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(score, 4);
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const score = getPasswordScore(password);
  const label =
    score <= 1
      ? 'Mật khẩu yếu'
      : score === 2
        ? 'Mật khẩu trung bình'
        : score === 3
          ? 'Mật khẩu khá'
          : 'Mật khẩu rất mạnh';

  const color =
    score <= 1
      ? 'bg-rose-500'
      : score === 2
        ? 'bg-amber-500'
        : score === 3
          ? 'bg-sky-500'
          : 'bg-emerald-500';

  const textColor =
    score <= 1
      ? 'text-rose-600 dark:text-rose-400'
      : score === 2
        ? 'text-amber-600 dark:text-amber-400'
        : score === 3
          ? 'text-sky-600 dark:text-sky-400'
          : 'text-emerald-600 dark:text-emerald-400';

  return (
    <div className="space-y-1.5 pt-1" aria-live="polite">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              'h-1 rounded-full transition-all duration-300',
              index < score ? color : 'bg-slate-200 dark:bg-slate-800',
            )}
          />
        ))}
      </div>
      <p className={cn('text-[11px] font-medium transition-colors', textColor)}>{label}</p>
    </div>
  );
}
