'use client';

import React from 'react';
import { WifiOff, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
      setIsRetrying(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <main className="max-w-md w-full border border-border rounded-2xl bg-card shadow-sm p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-sky-50 dark:bg-sky-950/50 rounded-full flex items-center justify-center mx-auto mb-2">
          <WifiOff className="w-8 h-8 text-sky-600 dark:text-sky-400" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Mất Kết Nối Mạng
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Thiết bị của bạn hiện không có kết nối Internet. Vui lòng kiểm tra lại đường truyền Wi-Fi hoặc dữ liệu di động (3G/4G).
          </p>
        </div>

        <div className="bg-muted/40 rounded-xl px-4 py-3 text-xs text-muted-foreground border border-border">
          <span>Hệ thống sẽ tự động kết nối lại khi có mạng. Vui lòng thử lại.</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-500 disabled:opacity-60 text-white rounded-full px-6 py-2.5 text-sm font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all duration-200"
          >
            <RotateCcw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Đang kiểm tra…' : 'Thử lại'}
          </button>
          
          <Link href="/" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold border border-white/10 hover:bg-white/5 active:scale-95 transition-all duration-200">
              <Home className="w-4 h-4" />
              Trang chủ
            </button>
          </Link>
        </div>
      </main>
    </div>
  );
}
