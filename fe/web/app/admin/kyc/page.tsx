"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminApi } from "@/features/admin/services/admin.api";
import { AdminPermissionGuard } from "@/features/admin/components/AdminPermissionGuard";
import { AdminPermission } from "@/types/admin-permissions";
import { AdminKycItem } from "@/features/admin/types/admin.types";

const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Chờ Duyệt",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Clock className="w-3 h-3 text-amber-600" />,
  },
  APPROVED: {
    label: "Đã Duyệt",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: <CheckCircle className="w-3 h-3 text-emerald-600" />,
  },
  REJECTED: {
    label: "Từ Chối",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="w-3 h-3 text-red-600" />,
  },
};

const filterTabs = [
  { value: "all", label: "Tất cả" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã duyệt" },
  { value: "REJECTED", label: "Từ chối" },
];

export default function KYCPage() {
  const [kycList, setKycList] = useState<AdminKycItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const fetchKycList = useCallback(() => {
    setLoading(true);
    const params: { page: number; limit: number; status?: string } = {
      page,
      limit,
    };
    if (selectedStatus !== "all") {
      params.status = selectedStatus;
    }
    adminApi
      .getKycRequests(params)
      .then((res) => {
        const items = res.data?.data?.items || res.data?.data || [];
        setKycList(items);
      })
      .catch(() => setKycList([]))
      .finally(() => setLoading(false));
  }, [page, selectedStatus]);

  useEffect(() => {
    fetchKycList();
  }, [fetchKycList]);

  const filteredKycList = useMemo(() => {
    if (!searchQuery.trim()) return kycList;
    const query = searchQuery.toLowerCase();
    return kycList.filter((item) => {
      const name = item.provider?.fullName?.toLowerCase() || "";
      const email = item.provider?.email?.toLowerCase() || "";
      const phone = item.provider?.phone?.toLowerCase() || "";
      return (
        name.includes(query) || email.includes(query) || phone.includes(query)
      );
    });
  }, [kycList, searchQuery]);

  return (
    <AdminPermissionGuard permission={AdminPermission.KYC_VIEW}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              <span>Quản Lý Xét Duyệt KYC</span>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Xác thực danh tính và chứng chỉ hành nghề của thợ trước khi hoạt động
            </p>
          </div>
        </div>

        {/* Filters & Search */}
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => {
                      setSelectedStatus(tab.value);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      selectedStatus === tab.value
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Tìm theo tên, email, SĐT..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KYC Table */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">
              Danh sách hồ sơ ({filteredKycList.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm">Đang tải danh sách KYC...</p>
              </div>
            ) : filteredKycList.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                <AlertCircle className="h-10 w-10 text-slate-400 mb-2" />
                <p className="font-semibold text-sm">Không tìm thấy hồ sơ nào</p>
                <p className="text-xs text-slate-400 mt-1">
                  Chưa có yêu cầu KYC nào phù hợp với bộ lọc hiện tại
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/80 text-xs text-slate-500 uppercase font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Mã hồ sơ</th>
                      <th className="px-5 py-3.5">Thợ yêu cầu</th>
                      <th className="px-5 py-3.5">Liên hệ</th>
                      <th className="px-5 py-3.5">Thời gian nộp</th>
                      <th className="px-5 py-3.5">Trạng thái</th>
                      <th className="px-5 py-3.5 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredKycList.map((item) => {
                      const status = statusConfig[item.status] || {
                        label: item.status,
                        className: "bg-slate-100 text-slate-700",
                        icon: null,
                      };
                      const dateStr = item.submittedAt || item.createdAt;
                      const dateFormatted = dateStr
                        ? new Date(dateStr).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "---";

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          <td className="px-5 py-4 font-mono font-medium text-slate-900">
                            #{item.id}
                          </td>
                          <td className="px-5 py-4 font-medium text-slate-900">
                            {item.provider?.fullName || `Thợ #${item.providerId}`}
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-500">
                            <div>{item.provider?.email || "Chưa có email"}</div>
                            <div className="text-slate-400 mt-0.5">
                              {item.provider?.phone || "Chưa có SĐT"}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-xs text-slate-500">
                            {dateFormatted}
                          </td>
                          <td className="px-5 py-4">
                            <Badge
                              variant="outline"
                              className={`gap-1.5 px-2.5 py-0.5 text-xs font-semibold ${status.className}`}
                            >
                              {status.icon}
                              <span>{status.label}</span>
                            </Badge>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link href={`/admin/kyc/${item.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                              >
                                <span>Xem hồ sơ</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPermissionGuard>
  );
}
