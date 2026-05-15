'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service like Sentry
    console.error('Global Error Boundary Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-muted dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <style>{`
        #chat-widget-btn, #chat-widget-modal, #back-to-top { display: none !important; }
      `}</style>
      <main className="max-w-xl w-full bg-white dark:bg-gray-900 border border-border dark:border-gray-800 rounded-[2rem] shadow-xl p-8 md:p-12 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-12 h-12 text-red-500" />
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground dark:text-white">
              Oops! Đã có lỗi xảy ra
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground leading-relaxed">
              Xin lỗi bạn, hệ thống vừa gặp một sự cố kỹ thuật nhỏ. Đội ngũ kỹ thuật đã ghi nhận vấn đề và đang xử lý.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              onClick={() => reset()}
              size="lg" 
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-base font-bold shadow-lg shadow-blue-500/30 transition-transform hover:-translate-y-1 gap-2"
            >
              <RefreshCcw className="w-5 h-5" />
              Tải Lại Trang
            </Button>
            <Link href="/">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto rounded-full px-8 py-6 text-base font-bold border-border dark:border-gray-700 hover:bg-muted dark:hover:bg-gray-800 transition-transform hover:-translate-y-1 gap-2"
              >
                <Home className="w-5 h-5" />
                Về Trang Chủ
              </Button>
            </Link>
          </div>
      </main>
    </div>
  );
}
