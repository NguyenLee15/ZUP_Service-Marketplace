"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { adminApi } from "@/features/admin/services/admin.api";
import {
  AdminUserItem,
  AdminUserRoleFilter,
  AdminUserStatusFilter,
  LockUserFormData,
} from "../types/admin-user.types";

export function useAdminUsersFlow() {
  const { toast } = useToast();
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

  const fetchUsers = useCallback(() => {
    setLoading(true);
    adminApi
      .getUsers({
        page,
        limit: 10,
        role: roleFilter,
        ...(searchTerm.trim() ? { keyword: searchTerm.trim() } : {}),
      })
      .then((res) => {
        setUsers((res.data?.data || []) as AdminUserItem[]);
        setTotalPages(res.data?.meta?.totalPages || 1);
      })
      .catch(() => {
        setUsers([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [page, roleFilter, searchTerm]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [fetchUsers]);

  const statusCounts = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.status === "ACTIVE").length,
      pending: users.filter((user) => user.status === "PENDING").length,
      locked: users.filter((user) => user.status === "LOCKED").length,
    }),
    [users],
  );

  const filteredUsers = useMemo(
    () =>
      statusFilter === "ALL"
        ? users
        : users.filter((user) => user.status === statusFilter),
    [statusFilter, users],
  );

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
    users: filteredUsers,
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
    handleLockUser,
    handleUnlockUser,
    refetch: fetchUsers,
  };
}

