"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { adminApi } from "@/features/admin/services/admin.api";
import { parseAdminUsersResponse } from "@/features/admin/schemas/admin-response.schemas";
import {
  AdminUserItem,
  AdminUserRoleFilter,
  AdminUserStatusFilter,
  LockUserFormData,
} from "../types/admin-user.types";

export function useAdminUsersFlow() {
  const { toast } = useToast();
  const requestIdRef = useRef(0);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<AdminUserRoleFilter>("CUSTOMER");
  const [statusFilter, setStatusFilter] =
    useState<AdminUserStatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [statusCounts, setStatusCounts] = useState({
    total: 0,
    active: 0,
    pending: 0,
    locked: 0,
  });

  const fetchUsers = useCallback(() => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    adminApi
      .getUsers({
        page,
        limit: 10,
        role: roleFilter,
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        ...(searchTerm.trim() ? { keyword: searchTerm.trim() } : {}),
      })
      .then((res) => {
        if (currentRequestId !== requestIdRef.current) return;
        const payload = parseAdminUsersResponse(res.data);
        setUsers(payload.data as AdminUserItem[]);
        setTotalPages(payload.meta.totalPages);
        setStatusCounts(
          payload.meta.statusCounts,
        );
      })
      .catch((err) => {
        if (currentRequestId !== requestIdRef.current) return;
        setUsers([]);
        setTotalPages(1);
        setStatusCounts({ total: 0, active: 0, pending: 0, locked: 0 });
        setError(
          err?.response?.data?.error?.message ||
            err?.response?.data?.message ||
            "Không thể tải danh sách người dùng. Vui lòng thử lại.",
        );
      })
      .finally(() => {
        if (currentRequestId === requestIdRef.current) {
          setLoading(false);
        }
      });
  }, [page, roleFilter, searchTerm, statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchUsers]);

  const handleLockUser = async (data: LockUserFormData) => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await adminApi.lockUser(selectedUser.id, { reason: data.reason });
      toast({ title: "Đã khóa tài khoản thành công" });
      setShowLockModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Không thể khóa tài khoản";
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlockUser = async (userToUnlock: AdminUserItem) => {
    setActionLoading(true);
    try {
      await adminApi.unlockUser(userToUnlock.id);
      toast({ title: "Đã mở khóa tài khoản thành công" });
      setShowLockModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Không thể mở khóa tài khoản";
      toast({
        title: "Lỗi",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  return {
    users,
    loading,
    searchTerm,
    setSearchTerm,
    selectedUser,
    setSelectedUser,
    showLockModal,
    setShowLockModal,
    actionLoading,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    statusCounts,
    page,
    setPage,
    totalPages,
    error,
    handleLockUser,
    handleUnlockUser,
    refetch: fetchUsers,
  };
}

