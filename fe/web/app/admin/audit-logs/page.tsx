"use client";

import React from "react";
import { Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPermissionGuard } from "@/features/admin/components/AdminPermissionGuard";
import { AdminPermission } from "@/types/admin-permissions";
import { useAdminAuditLogsFlow } from "@/features/admin/audit-logs/hooks/useAdminAuditLogsFlow";
import {
  AuditLogsFilterCard,
  AuditLogsTable,
} from "@/features/admin/audit-logs/components";

function AuditLogsContent() {
  const {
    filters,
    setFilters,
    updateFilter,
    logs,
    loading,
    exporting,
    showAdvanced,
    setShowAdvanced,
    totalPages,
    totalRecords,
    exportCsv,
  } = useAdminAuditLogsFlow();

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span>Nhật Ký Hoạt Động (Audit Logs)</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi vết kiểm toán toàn diện về bảo mật, tài chính và thay đổi trạng thái
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
            onClick={exportCsv}
            disabled={exporting || logs.length === 0}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? "Đang xuất..." : "Xuất file CSV"}</span>
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <AuditLogsFilterCard
        filters={filters}
        updateFilter={updateFilter}
        setFilters={setFilters}
        showAdvanced={showAdvanced}
        setShowAdvanced={setShowAdvanced}
      />

      {/* Audit Log Table */}
      <AuditLogsTable
        logs={logs}
        loading={loading}
        page={filters.page}
        totalPages={totalPages}
        setPage={(newPage) => updateFilter("page", newPage)}
      />
    </div>
  );
}

export default function AdminAuditLogsPage() {
  return (
    <AdminPermissionGuard permission={AdminPermission.AUDIT_LOG_VIEW}>
      <AuditLogsContent />
    </AdminPermissionGuard>
  );
}
