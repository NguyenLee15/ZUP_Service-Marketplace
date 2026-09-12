"use client";

import React from "react";
import { Lock, Unlock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { AdminUserItem } from "../types/admin-user.types";

interface AdminUserTableProps {
  users: AdminUserItem[];
  loading: boolean;
  page: number;
  totalPages: number;
  setPage: (page: number | ((p: number) => number)) => void;
  onOpenLockDialog: (user: AdminUserItem) => void;
  onUnlockUser: (user: AdminUserItem) => void;
  actionLoading: boolean;
}

const statusBadgeConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: "Hoạt động",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  LOCKED: {
    label: "Bị khóa",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  PENDING: {
    label: "Chờ duyệt",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
};

export function AdminUserTable({
  users,
  loading,
  page,
  totalPages,
  setPage,
  onOpenLockDialog,
  onUnlockUser,
  actionLoading,
}: AdminUserTableProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-12 text-slate-400 space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Đang tải danh sách người dùng...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white p-12 text-center text-slate-500">
        <AlertCircle className="h-10 w-10 text-slate-400 mb-2" />
        <p className="font-semibold text-sm">Không tìm thấy người dùng nào</p>
        <p className="text-xs text-slate-400 mt-1">
          Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <Table className="w-full text-left text-sm text-slate-600">
          <TableHeader className="bg-slate-50">
            <TableRow className="border-b border-slate-100">
              <TableHead className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Người dùng</TableHead>
              <TableHead className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Liên hệ</TableHead>
              <TableHead className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Vai trò</TableHead>
              <TableHead className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Trạng thái</TableHead>
              <TableHead className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày tham gia</TableHead>
              <TableHead className="px-4 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {users.map((user) => {
              const status = statusBadgeConfig[user.status] || {
                label: user.status,
                className: "border-slate-200 bg-slate-50 text-slate-600",
              };
              return (
                <TableRow key={user.id} className="hover:bg-slate-50/80 transition-colors">
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 font-bold text-white text-xs shrink-0">
                        {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{user.fullName}</p>
                        <p className="text-xs text-slate-400 font-mono tabular-nums">ID: {user.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <p className="text-slate-800 font-medium">{user.email}</p>
                    <p className="text-xs text-slate-500 font-mono tabular-nums">{user.phone || "Chưa có SĐT"}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {user.role === "PROVIDER" ? "Thợ đối tác" : "Khách hàng"}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="outline" className={`text-xs ${status.className}`}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs tabular-nums text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    {user.status === "LOCKED" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => onUnlockUser(user)}
                        className="text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50 gap-1"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Mở khóa</span>
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        onClick={() => onOpenLockDialog(user)}
                        className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50 gap-1"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Khóa</span>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-500">
            Trang {page} / {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

