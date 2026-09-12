'use client';

import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/navigation/BackButton';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-muted dark:bg-gray-950 flex flex-col">
      <style>{`
        #chat-widget-btn, #chat-widget-modal, #back-to-top { display: none !important; }
      `}</style>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="relative">
            <h1 className="text-9xl font-extrabold text-slate-800 dark:text-slate-100 drop-shadow-sm select-none tracking-tight">
              404
            </h1>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center opacity-10 pointer-events-none">
              <Search className="w-64 h-64 text-slate-700 dark:text-slate-300" />
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground dark:text-white">
              Lạc đường rồi bạn ơi!
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Dịch vụ hoặc trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc đã được chuyển sang một địa chỉ mới.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/">
              <Button size="lg" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 py-6 text-base font-bold shadow-lg shadow-blue-500/30 transition-transform hover:-translate-y-1 gap-2">
                <Home className="w-5 h-5" />
                Về Trang Chủ
              </Button>
            </Link>
            <BackButton
              fallbackHref="/"
              label="Quay lại"
              variant="button"
              className="w-full justify-center rounded-full px-8 py-6 text-base sm:w-auto"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
