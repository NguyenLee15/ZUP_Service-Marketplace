'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin Error]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-4">
        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-950/30 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Lỗi quản trị</h2>
        <p className="text-muted-foreground text-sm">
          Có lỗi xảy ra trong khu vực quản trị. Vui lòng thử lại.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="outline">Thử lại</Button>
          <Button onClick={() => window.location.href = '/admin/dashboard'}>Về Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
