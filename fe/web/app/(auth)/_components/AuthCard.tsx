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
      <CardHeader className="space-y-1.5 p-6 pb-2 text-left sm:p-8 sm:pb-3">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        {description && (
          <CardDescription className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4 p-6 pt-4 sm:p-8 sm:pt-4">
        {children}
      </CardContent>
    </Card>
  );
}
