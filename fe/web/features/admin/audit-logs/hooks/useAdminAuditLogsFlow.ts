"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { adminApi } from "@/features/admin/services/admin.api";
import { AuditFilters, AuditLogItem } from "../types/audit-log.types";

export const initialAuditFilters: AuditFilters = {
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

function unwrapList(payload: unknown): { data: AuditLogItem[]; meta: { total?: number; totalPages?: number } } {
  const p = payload as { data?: unknown; meta?: { total?: number; totalPages?: number } };
  if (Array.isArray(p?.data)) {
    return { data: p.data as AuditLogItem[], meta: p?.meta || {} };
  }
  const nested = p?.data as { data?: unknown; meta?: { total?: number; totalPages?: number } };
  if (Array.isArray(nested?.data)) {
    return {
      data: nested.data as AuditLogItem[],
      meta: nested.meta || p?.meta || {},
    };
  }
  return { data: [], meta: p?.meta || nested?.meta || {} };
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

export function useAdminAuditLogsFlow() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<AuditFilters>(initialAuditFilters);
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [meta, setMeta] = useState<{ total?: number; totalPages?: number }>({});
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const queryParams = useMemo(() => compactFilters(filters), [filters]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAuditLogs(queryParams);
      const unwrapped = unwrapList(res.data);
      setLogs(unwrapped.data);
      setMeta(unwrapped.meta);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Không tải được audit logs";
      toast({
        title: "Lỗi",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [queryParams, toast]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

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
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Không thể xuất file CSV";
      toast({
        title: "Lỗi xuất file",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const totalPages =
    Number(meta.totalPages) ||
    Math.max(1, Math.ceil((Number(meta.total) || logs.length) / filters.limit));

  return {
    filters,
    setFilters,
    updateFilter,
    logs,
    loading,
    exporting,
    showAdvanced,
    setShowAdvanced,
    totalPages,
    totalRecords: Number(meta.total) || logs.length,
    exportCsv,
    refetch: fetchLogs,
  };
}

