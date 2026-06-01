"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Download,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { adminApi } from "@/features/auth/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

type AuditLogActor = {
  id?: number;
  email?: string;
  fullName?: string;
  role?: string;
};

type AuditLog = {
  id: number;
  createdAt: string;
  actor?: AuditLogActor | null;
  actorId?: number | null;
  action: string;
  targetType?: string | null;
  targetId?: number | string | null;
  ipAddress?: string | null;
  description?: string | null;
};

type AuditFilters = {
  keyword: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  from: string;
  to: string;
  page: number;
  limit: number;
};

const initialFilters: AuditFilters = {
  keyword: "",
  actorId: "",
  action: "",
  targetType: "",
  targetId: "",
  from: "",
  to: "",
  page: 1,
  limit: 20,
};

function unwrapList(payload: any): { data: AuditLog[]; meta: any } {
  const directData = payload?.data;
  if (Array.isArray(directData)) {
    return { data: directData, meta: payload?.meta || {} };
  }
  if (Array.isArray(directData?.data)) {
    return {
      data: directData.data,
      meta: directData.meta || payload?.meta || {},
    };
  }
  return { data: [], meta: payload?.meta || directData?.meta || {} };
}

function compactFilters(filters: AuditFilters) {
  return {
    keyword: filters.keyword.trim() || undefined,
    actorId: filters.actorId ? Number(filters.actorId) : undefined,
    action: filters.action.trim() || undefined,
    targetType: filters.targetType.trim() || undefined,
    targetId: filters.targetId ? Number(filters.targetId) : undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
    page: filters.page,
    limit: filters.limit,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminAuditLogsPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const queryParams = useMemo(() => compactFilters(filters), [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs(queryParams);
      const unwrapped = unwrapList(res.data);
      setLogs(unwrapped.data);
      setMeta(unwrapped.meta);
    } catch (err: any) {
      toast({
        title: "Không tải được audit logs",
        description: err.response?.data?.error?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
  }, [queryParams]);

  const updateFilter = (key: keyof AuditFilters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await adminApi.exportAuditLogs(queryParams);
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast({
        title: "Không thể xuất CSV",
        description: err.response?.data?.error?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const totalPages =
    Number(meta.totalPages) ||
    Math.max(1, Math.ceil((Number(meta.total) || logs.length) / filters.limit));

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Audit logs
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi thao tác quản trị, phân quyền và nghiệp vụ nhạy cảm.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchLogs}
            className="gap-2 rounded-xl"
          >
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
          <Button
            onClick={exportCsv}
            disabled={exporting}
            className="gap-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <Filter className="h-4 w-4 text-slate-500" />
            Bộ lọc
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={filters.keyword}
              onChange={(event) => updateFilter("keyword", event.target.value)}
              placeholder="Tìm action, mô tả, actor..."
              className="pl-9"
            />
          </div>
          <Input
            value={filters.actorId}
            onChange={(event) => updateFilter("actorId", event.target.value)}
            placeholder="Actor ID"
            type="number"
          />
          <Input
            value={filters.action}
            onChange={(event) => updateFilter("action", event.target.value)}
            placeholder="Action"
          />
          <Input
            value={filters.targetType}
            onChange={(event) => updateFilter("targetType", event.target.value)}
            placeholder="Target type"
          />
          <Input
            value={filters.targetId}
            onChange={(event) => updateFilter("targetId", event.target.value)}
            placeholder="Target ID"
            type="number"
          />
          <Input
            value={filters.from}
            onChange={(event) => updateFilter("from", event.target.value)}
            type="date"
            aria-label="Từ ngày"
          />
          <Input
            value={filters.to}
            onChange={(event) => updateFilter("to", event.target.value)}
            type="date"
            aria-label="Đến ngày"
          />
        </CardContent>
      </Card>

      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center">
              <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">
                Không có audit log phù hợp bộ lọc
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">IP</th>
                    <th className="px-4 py-3">Mô tả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80">
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">
                          {log.actor?.fullName ||
                            log.actor?.email ||
                            `Actor #${log.actorId || "-"}`}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                          {log.actor?.email}
                          {log.actor?.role && (
                            <Badge className="border-0 bg-slate-100 text-[10px] text-slate-600">
                              {log.actor.role}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="border-0 bg-blue-50 font-mono text-[10px] text-blue-700">
                          {log.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {log.targetType || "-"}
                        {log.targetId ? (
                          <span className="ml-1 font-mono text-slate-400">
                            #{log.targetId}
                          </span>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-slate-400">
                        {log.ipAddress || "-"}
                      </td>
                      <td className="max-w-xl px-4 py-3 text-xs text-slate-600">
                        {log.description || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>
          Trang {filters.page}/{totalPages} · {meta.total || logs.length} bản
          ghi
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={filters.page <= 1 || loading}
            onClick={() => updateFilter("page", filters.page - 1)}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            disabled={filters.page >= totalPages || loading}
            onClick={() => updateFilter("page", filters.page + 1)}
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}
