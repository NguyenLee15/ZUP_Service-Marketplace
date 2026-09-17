"use client";

import React from "react";
import { AlertCircle, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPermissionGuard, useAdminPermission } from "@/features/admin/components/AdminPermissionGuard";
import { AdminPermission } from "@/types/admin-permissions";
import { useAdminUsersFlow } from "@/features/admin/users/hooks/useAdminUsersFlow";
import {
  AdminUserFilters,
  AdminUserTable,
  AdminUserLockDialog,
} from "@/features/admin/users/components";

export default function UsersPage() {
  const { hasPermission } = useAdminPermission();
  const canLockUser = hasPermission(AdminPermission.USER_LOCK);
  const {
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
    refetch,
    handleLockUser,
    handleUnlockUser,
  } = useAdminUsersFlow();

  return (
    <AdminPermissionGuard permission={AdminPermission.USER_VIEW}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-blue-600" />
            <span>Quản Lý Người Dùng</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tra cứu, kiểm duyệt và phân quyền tài khoản Khách hàng và Thợ đối tác
          </p>
        </div>

        <AdminUserFilters
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          statusCounts={statusCounts}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        {error ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-rose-200 bg-white p-12 text-center text-slate-500">
            <AlertCircle className="mb-2 h-10 w-10 text-rose-500" />
            <p className="text-sm font-semibold text-slate-800">{error}</p>
            <Button variant="outline" size="sm" onClick={refetch} className="mt-3">
              Tải lại danh sách
            </Button>
          </div>
        ) : (
          <AdminUserTable
            users={users}
            loading={loading}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            onOpenLockDialog={(user) => {
              setSelectedUser(user);
              setShowLockModal(true);
            }}
            onUnlockUser={handleUnlockUser}
            actionLoading={actionLoading}
            canLockUser={canLockUser}
          />
        )}

        <AdminUserLockDialog
          open={showLockModal}
          onOpenChange={(open) => {
            setShowLockModal(open);
            if (!open) setSelectedUser(null);
          }}
          user={selectedUser}
          onSubmit={handleLockUser}
          actionLoading={actionLoading}
        />
      </div>
    </AdminPermissionGuard>
  );
}
