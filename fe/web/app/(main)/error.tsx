'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Customer Error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-4">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Đã xảy ra lỗi</h2>
        <p className="text-muted-foreground text-sm">
          Có lỗi xảy ra khi tải trang. Vui lòng thử lại hoặc quay về trang chủ.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline">Thử lại</Button>
          <Button onClick={() => window.location.href = '/'}>Về trang chủ</Button>
        </div>
      </div>
    </div>
  );
}
