import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AuthCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function AuthCard({ title, description, children, className }: AuthCardProps) {
  return (
    <Card className={cn('w-full border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-sm py-0 overflow-hidden', className)}>
      <CardHeader className="p-6 pb-2 text-center space-y-1.5">
        <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </CardTitle>
        {description && (
          <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="p-6 pt-4 space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}
