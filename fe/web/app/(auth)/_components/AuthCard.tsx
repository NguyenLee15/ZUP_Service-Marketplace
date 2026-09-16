import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function AuthCard({ title, description, children, className }: AuthCardProps) {
  return (
    <Card className={cn('w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white py-0 shadow-sm dark:border-slate-800 dark:bg-slate-900', className)}>
      <CardHeader className="space-y-1 p-5 pb-1 text-left sm:px-7 sm:pt-6 sm:pb-2">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        {description && (
          <CardDescription className="text-xs sm:text-[13px] leading-normal text-slate-600 dark:text-slate-400">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3 p-5 pt-2 sm:px-7 sm:pt-3 sm:pb-6">
        {children}
      </CardContent>
    </Card>
  );
}
