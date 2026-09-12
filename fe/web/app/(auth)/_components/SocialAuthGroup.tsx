'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Script from 'next/script';
import { getGoogleIdentity, type GoogleCredentialResponse } from './auth-utils';

interface SocialAuthGroupProps {
  onGoogleSuccess: (response: GoogleCredentialResponse) => void;
  onError: (msg: string) => void;
  disabled?: boolean;
  mode?: 'signin' | 'signup';
}

export function SocialAuthGroup({
  onGoogleSuccess,
  onError,
  disabled = false,
  mode = 'signin',
}: SocialAuthGroupProps) {
  const [gsiReady, setGsiReady] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleCallback = useCallback(
    (res: GoogleCredentialResponse) => {
      if (!res.credential) {
        onError('Không nhận được thông tin xác thực từ Google.');
        return;
      }
      onGoogleSuccess(res);
    },
    [onGoogleSuccess, onError]
  );

  const handleFallbackClick = useCallback(() => {
    if (!googleClientId) {
      onError('Tính năng đăng nhập Google hiện chưa được cấu hình Client ID.');
      return;
    }

    const google = getGoogleIdentity();
    if (!google) {
      onError('Dịch vụ Google đang tải. Vui lòng thử lại sau vài giây.');
      return;
    }

    try {
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCallback,
      });
      google.accounts.id.prompt();
    } catch {
      onError('Không thể mở cửa sổ Google. Vui lòng kiểm tra chặn pop-up của trình duyệt.');
    }
  }, [googleClientId, handleCallback, onError]);

  useEffect(() => {
    if (getGoogleIdentity()) {
      setGsiReady(true);
    }
  }, []);

  useEffect(() => {
    const google = getGoogleIdentity();
    if (!gsiReady || !googleBtnRef.current || !google || !googleClientId) return;

    const timer = setTimeout(() => {
      if (!googleBtnRef.current) return;
      try {
        googleBtnRef.current.innerHTML = '';
        google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleCallback,
        });
        google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: googleBtnRef.current.offsetWidth || 380,
          text: mode === 'signin' ? 'signin_with' : 'signup_with',
          shape: 'rectangular',
        });
      } catch {
        // Fallback button remains visible
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [gsiReady, googleClientId, handleCallback, mode]);

  return (
    <div className="w-full space-y-3">
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-medium">
            hoặc tiếp tục với
          </span>
        </div>
      </div>

      <div
        ref={googleBtnRef}
        className="min-h-11 w-full flex items-center justify-center rounded-xl overflow-hidden"
      >
        <button
          type="button"
          disabled={disabled}
          onClick={handleFallbackClick}
          className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-50 cursor-pointer"
        >
          <svg className="size-4.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
            />
          </svg>
          <span>{mode === 'signin' ? 'Đăng nhập với Google' : 'Đăng ký với Google'}</span>
        </button>
      </div>

      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setGsiReady(true)}
      />
    </div>
  );
}
