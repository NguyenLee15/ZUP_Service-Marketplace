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
    score <= 1 ? 'Mật khẩu yếu' : score === 2 ? 'Mật khẩu ổn' : 'Mật khẩu mạnh';
  const color =
    score <= 1
      ? 'bg-red-500'
      : score === 2
        ? 'bg-amber-pop'
        : 'bg-action-blue';

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="grid grid-cols-4 gap-2" aria-hidden="true">
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 rounded-full bg-pale-gray transition-colors',
              index < score && color,
            )}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-slate-blue">{label}</p>
    </div>
  );
}
