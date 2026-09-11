"use client";

import React from "react";
import { Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuditLogItem } from "../types/audit-log.types";

interface AuditLogsTableProps {
  logs: AuditLogItem[];
  loading: boolean;
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
}

const actionBadgeColors: Record<string, string> = {
  LOCK_USER: "bg-rose-100 text-rose-800 border-rose-200",
  UNLOCK_USER: "bg-emerald-100 text-emerald-800 border-emerald-200",
  DELETE_USER: "bg-red-100 text-red-900 border-red-300",
  CREATE_STAFF: "bg-blue-100 text-blue-800 border-blue-200",
  UPDATE_STAFF: "bg-indigo-100 text-indigo-800 border-indigo-200",
  MANUAL_DEPOSIT_APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
  WITHDRAWAL_APPROVED: "bg-purple-100 text-purple-800 border-purple-200",
  RESOLVE_DISPUTE: "bg-amber-100 text-amber-800 border-amber-200",
};

export function AuditLogsTable({
  logs,
  loading,
  page,
  totalPages,
  setPage,
}: AuditLogsTableProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border bg-white p-14 text-slate-400 space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Đang tải nhật ký audit logs...</p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-white p-14 text-center text-slate-500">
        <AlertCircle className="h-10 w-10 text-slate-400 mb-2" />
        <p className="font-semibold text-sm">Không tìm thấy bản ghi audit log nào</p>
        <p className="text-xs text-slate-400 mt-1">
          Thử thay đổi bộ lọc hoặc mở rộng khoảng thời gian
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="border-b bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3.5">Thời gian</th>
              <th className="px-4 py-3.5">Người thực hiện</th>
              <th className="px-4 py-3.5">Hành động</th>
              <th className="px-4 py-3.5">Đối tượng</th>
              <th className="px-4 py-3.5">Chi tiết mô tả</th>
              <th className="px-4 py-3.5">Địa chỉ IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {logs.map((log) => {
              const badgeClass =
                actionBadgeColors[log.action] ||
                "bg-slate-100 text-slate-700 border-slate-200";
              return (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-3">
                    {log.actor ? (
                      <div>
                        <p className="font-semibold text-slate-900 text-xs">
                          {log.actor.fullName || "—"}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {log.actor.email} ({log.actor.role})
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {log.actorId ? `User #${log.actorId}` : "Hệ thống (System)"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className={`text-xs ${badgeClass}`}>
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-medium text-slate-700">
                      {log.targetType || "—"}
                    </span>
                    {log.targetId && (
                      <span className="text-slate-400 ml-1">#{log.targetId}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 max-w-xs truncate" title={log.description || ""}>
                    {log.description || "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {log.ipAddress || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              Trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

