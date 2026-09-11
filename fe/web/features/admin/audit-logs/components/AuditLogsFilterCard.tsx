"use client";

import React from "react";
import { Filter, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuditFilters } from "../types/audit-log.types";
import { initialAuditFilters } from "../hooks/useAdminAuditLogsFlow";

interface AuditLogsFilterCardProps {
  filters: AuditFilters;
  updateFilter: (key: keyof AuditFilters, value: string | number) => void;
  setFilters: React.Dispatch<React.SetStateAction<AuditFilters>>;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean | ((s: boolean) => boolean)) => void;
}

export function AuditLogsFilterCard({
  filters,
  updateFilter,
  setFilters,
  showAdvanced,
  setShowAdvanced,
}: AuditLogsFilterCardProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={filters.keyword}
              onChange={(e) => updateFilter("keyword", e.target.value)}
              placeholder="Tìm theo mô tả, IP..."
              className="pl-9 text-xs"
            />
          </div>

          <Select
            value={filters.action || "ALL"}
            onValueChange={(val) =>
              updateFilter("action", val === "ALL" ? "" : val)
            }
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Tất cả hành động" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả hành động</SelectItem>
              <SelectItem value="LOCK_USER">Khóa tài khoản</SelectItem>
              <SelectItem value="UNLOCK_USER">Mở khóa tài khoản</SelectItem>
              <SelectItem value="DELETE_USER">Xóa tài khoản</SelectItem>
              <SelectItem value="CREATE_STAFF">Tạo nhân viên</SelectItem>
              <SelectItem value="UPDATE_STAFF">Cập nhật nhân viên</SelectItem>
              <SelectItem value="MANUAL_DEPOSIT_APPROVED">
                Duyệt nạp tiền
              </SelectItem>
              <SelectItem value="WITHDRAWAL_APPROVED">Duyệt rút tiền</SelectItem>
              <SelectItem value="RESOLVE_DISPUTE">Giải quyết khiếu nại</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.targetType || "ALL"}
            onValueChange={(val) =>
              updateFilter("targetType", val === "ALL" ? "" : val)
            }
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Tất cả đối tượng" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả đối tượng</SelectItem>
              <SelectItem value="USER">Người dùng (USER)</SelectItem>
              <SelectItem value="STAFF">Nhân viên (STAFF)</SelectItem>
              <SelectItem value="BOOKING">Đơn hàng (BOOKING)</SelectItem>
              <SelectItem value="DISPUTE">Khiếu nại (DISPUTE)</SelectItem>
              <SelectItem value="WALLET">Ví (WALLET)</SelectItem>
              <SelectItem value="SYSTEM">Hệ thống (SYSTEM)</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs gap-1"
              onClick={() => setShowAdvanced((prev) => !prev)}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{showAdvanced ? "Thu gọn" : "Nâng cao"}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1"
              onClick={() => setFilters(initialAuditFilters)}
              title="Đặt lại bộ lọc"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 gap-3 pt-3 border-t md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Từ ngày
              </label>
              <Input
                type="date"
                value={filters.from}
                onChange={(e) => updateFilter("from", e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                Đến ngày
              </label>
              <Input
                type="date"
                value={filters.to}
                onChange={(e) => updateFilter("to", e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                ID Người thực hiện
              </label>
              <Input
                type="number"
                value={filters.actorId}
                onChange={(e) => updateFilter("actorId", e.target.value)}
                placeholder="Ví dụ: 1"
                className="text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                ID Đối tượng tác động
              </label>
              <Input
                type="number"
                value={filters.targetId}
                onChange={(e) => updateFilter("targetId", e.target.value)}
                placeholder="Ví dụ: 45"
                className="text-xs"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

