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
        "rounded-lg border border-[var(--admin-border)] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {(title || action) && (
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-[var(--admin-border)] bg-slate-50/70 px-4 py-3">
          {title && (
            <CardTitle className="text-sm font-semibold text-slate-900">
              {title}
            </CardTitle>
          )}
          {action}
        </CardHeader>
      )}
      <CardContent className={cn("p-4", contentClassName)}>
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
  blue: "bg-slate-900 text-white",
  green:
    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  slate: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
};

export function AdminMetricCard({
  label,
  value,
  icon: Icon,
  loading,
  accent,
}: AdminMetricCardProps) {
  return (
    <AdminDashboardCard contentClassName="flex items-center gap-3 p-4">
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-md",
          metricAccent[accent],
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12px] font-medium text-slate-500">
          {label}
        </p>
        {loading ? (
          <Skeleton className="mt-2 h-7 w-24 rounded-md" />
        ) : (
          <p className="admin-kpi-number mt-1 truncate text-2xl font-bold text-slate-950">
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
    info: "border-slate-200 bg-slate-100 text-slate-700",
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    warning:
      "border-amber-200 bg-amber-50 text-amber-700",
    danger:
      "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <Badge variant="outline" className={cn("rounded-full px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-[0.05em]", toneClass[tone])}>
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
    <div className="flex h-full min-h-[220px] items-center justify-center text-slate-500">
      <div className="flex flex-col items-center gap-3">
        <div className="size-6 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
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
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
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
          className="w-fit rounded-md border-rose-200 bg-white text-rose-700 transition-colors hover:bg-rose-100"
        >
          Tải lại
        </Button>
      </div>
    </div>
  );
}
