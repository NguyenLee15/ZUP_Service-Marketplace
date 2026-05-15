import type { ComponentType, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type AdminDashboardCardProps = {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function AdminDashboardCard({
  title,
  action,
  children,
  className,
  contentClassName,
}: AdminDashboardCardProps) {
  return (
    <Card
      className={cn(
        "rounded-xl border border-platinum-tint/80 bg-white shadow-[var(--brand-shadow-sm)] dark:border-gray-800 dark:bg-gray-900",
        className,
      )}
    >
      {(title || action) && (
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-platinum-tint/60 px-5 py-4 dark:border-gray-800">
          {title && (
            <CardTitle className="text-base font-semibold text-midnight-indigo dark:text-white">
              {title}
            </CardTitle>
          )}
          {action}
        </CardHeader>
      )}
      <CardContent className={cn("p-5", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}

type AdminMetricCardProps = {
  label: string;
  value: number | string;
  icon: ComponentType<{ className?: string }>;
  loading: boolean;
  accent: "blue" | "green" | "amber" | "slate";
};

const metricAccent = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/35 dark:text-blue-300",
  green:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/35 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/35 dark:text-amber-300",
  slate: "bg-pale-gray text-slate-blue dark:bg-gray-800 dark:text-gray-300",
};

export function AdminMetricCard({
  label,
  value,
  icon: Icon,
  loading,
  accent,
}: AdminMetricCardProps) {
  return (
    <AdminDashboardCard contentClassName="flex items-center gap-4 p-5">
      <div
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-lg",
          metricAccent[accent],
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-slate-blue dark:text-gray-400">
          {label}
        </p>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-24 rounded-md" />
        ) : (
          <p className="mt-1 truncate text-2xl font-semibold text-midnight-indigo dark:text-white">
            {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
          </p>
        )}
      </div>
    </AdminDashboardCard>
  );
}

export function AdminStatusBadge({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  children: ReactNode;
}) {
  const toneClass = {
    info: "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/30 dark:text-blue-300",
    success:
      "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300",
    warning:
      "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/30 dark:text-amber-300",
    danger:
      "border-red-100 bg-red-50 text-red-700 dark:border-red-800/40 dark:bg-red-950/30 dark:text-red-300",
  };

  return (
    <Badge variant="outline" className={cn("font-medium", toneClass[tone])}>
      {children}
    </Badge>
  );
}

export function DashboardLoadingState({
  label = "Đang tải…",
}: {
  label?: string;
}) {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center text-slate-blue">
      <div className="flex flex-col items-center gap-3">
        <div className="size-6 rounded-full border-2 border-action-blue border-t-transparent animate-spin" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}

export function DashboardErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="text-sm font-medium">{message}</p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRetry}
          className="w-fit border-red-200 bg-white text-red-700 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300"
        >
          Tải lại
        </Button>
      </div>
    </div>
  );
}
