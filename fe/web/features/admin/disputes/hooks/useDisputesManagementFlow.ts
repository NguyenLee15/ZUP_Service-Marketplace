"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { adminApi } from "@/features/admin/services/admin.api";

export interface AdminDisputeListItem {
  id: number;
  status: "PENDING" | "RESOLVED" | string;
  reason?: string;
  createdAt: string;
  booking?: {
    bookingCode?: string;
    service?: { name?: string };
    customer?: { fullName?: string };
    provider?: { fullName?: string };
  };
}

export function useDisputesManagementFlow() {
  const fetchRequestIdRef = useRef(0);
  const [disputes, setDisputes] = useState<AdminDisputeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"PENDING" | "RESOLVED" | "">("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDisputes = useCallback(async () => {
    const currentRequestId = ++fetchRequestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      if (debouncedSearchTerm.trim()) params.keyword = debouncedSearchTerm.trim();
      const res = await adminApi.getDisputes(params);
      if (currentRequestId !== fetchRequestIdRef.current) return;
      setDisputes((res.data?.data || []) as AdminDisputeListItem[]);
      setTotalPages(res.data?.meta?.totalPages || 1);
    } catch (err: unknown) {
      if (currentRequestId !== fetchRequestIdRef.current) return;
      setDisputes([]);
      setTotalPages(1);
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ||
          "Không thể tải danh sách khiếu nại",
      );
    } finally {
      if (currentRequestId === fetchRequestIdRef.current) setLoading(false);
    }
  }, [debouncedSearchTerm, page, statusFilter]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    void fetchDisputes();
  }, [fetchDisputes]);

  return {
    disputes,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    page,
    setPage,
    totalPages,
    refetch: fetchDisputes,
  };
}
