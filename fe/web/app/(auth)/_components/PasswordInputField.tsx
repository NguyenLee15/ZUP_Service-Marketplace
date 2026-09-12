'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PasswordInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  error?: string;
  className?: string;
}

export const PasswordInputField = React.forwardRef<HTMLInputElement, PasswordInputFieldProps>(
  ({ id, label = 'Mật khẩu', error, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="space-y-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <Label htmlFor={id} className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
              {label}
            </Label>
          </div>
        )}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <Lock className="w-4 h-4" />
          </div>
          <Input
            ref={ref}
            id={id}
            type={showPassword ? 'text' : 'password'}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : undefined}
            className={cn(
              'h-11 pl-9.5 pr-11 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-sm focus-visible:ring-sky-500',
              error && 'border-rose-500 focus-visible:ring-rose-400',
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
            tabIndex={-1}
            className="absolute right-1 top-1/2 -translate-y-1/2 size-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && (
          <p id={`${id}-error`} className="text-xs text-rose-500 font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

PasswordInputField.displayName = 'PasswordInputField';
