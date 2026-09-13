import type { ReactNode } from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoadingSkeleton({ className = 'h-32' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl border border-border bg-muted ${className}`} />;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
      <Inbox className="mb-3 h-10 w-10 text-muted-foreground/60" aria-hidden="true" />
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Không thể tải dữ liệu', description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-10 text-center">
      <AlertCircle className="mb-3 h-9 w-9 text-destructive" aria-hidden="true" />
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {onRetry && <Button type="button" variant="outline" className="mt-4" onClick={onRetry}>Thử lại</Button>}
    </div>
  );
}

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'destructive' | 'info' }) {
  const tones = {
    neutral: 'bg-muted text-muted-foreground',
    success: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    destructive: 'bg-destructive/10 text-destructive',
    info: 'bg-primary/10 text-primary',
  };
  return <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-semibold ${tones[tone]}`}>{label}</span>;
}

export function PendingIndicator({ label = 'Đang xử lý…' }: { label?: string }) {
  return <span className="inline-flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />{label}</span>;
}
