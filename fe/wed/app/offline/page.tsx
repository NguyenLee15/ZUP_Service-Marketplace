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
    <div className="aether-page min-h-screen flex flex-col items-center justify-center p-4 bg-[#101415] text-[#e0e3e5]">
      <main className="max-w-md w-full glass-panel border border-white/10 rounded-[2rem] shadow-2xl p-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <WifiOff className="w-10 h-10 text-cyan-400" />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Mất Kết Nối Mạng
          </h1>
          <p className="text-sm text-[#bfc7d2] leading-relaxed">
            Thiết bị của bạn hiện không có kết nối Internet. Vui lòng kiểm tra lại đường truyền Wi-Fi hoặc dữ liệu di động (3G/4G).
          </p>
        </div>

        <div className="bg-[#1d2022] rounded-xl px-4 py-3 text-xs text-[#bfc7d2]/80 border border-white/5">
          <span>Hệ thống đã lưu cache ứng dụng. Bạn có thể tải lại trang khi kết nối mạng được khôi phục.</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-blue-600 hover:to-cyan-500 disabled:opacity-60 text-white rounded-full px-6 py-2.5 text-sm font-bold shadow-lg shadow-cyan-500/20 active:scale-95 transition-all duration-200"
          >
            <RotateCcw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Đang kiểm tra...' : 'Thử lại'}
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
