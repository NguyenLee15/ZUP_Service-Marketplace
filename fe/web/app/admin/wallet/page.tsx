"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  WalletCards,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Building2,
  User,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminApi } from "@/features/admin/services/admin.api";
import { AdminPermissionGuard } from "@/features/admin/components/AdminPermissionGuard";
import { AdminPermission } from "@/types/admin-permissions";
import { AdminWalletWithdrawalItem } from "@/features/admin/types/admin.types";

interface ExtendedWithdrawalItem extends AdminWalletWithdrawalItem {
  bankName?: string;
  bankAccountHolder?: string;
}

const statusConfig: Record<
  string,
  { label: string; className: string; icon: React.ReactNode }
> = {
  PENDING: {
    label: "Chờ xử lý",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Clock className="w-3 h-3 text-amber-600" />,
  },
  APPROVED: {
    label: "Đã xử lý",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: <CheckCircle className="w-3 h-3 text-emerald-600" />,
  },
  REJECTED: {
    label: "Từ chối",
    className: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="w-3 h-3 text-red-600" />,
  },
};

const statusFilters = [
  { value: "all", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "APPROVED", label: "Đã xử lý" },
  { value: "REJECTED", label: "Từ chối" },
];

function AdminWalletContent() {
  const { toast } = useToast();
  const [status, setStatus] = useState("PENDING");
  const [withdrawals, setWithdrawals] = useState<ExtendedWithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selected, setSelected] = useState<ExtendedWithdrawalItem | null>(null);
  const [note, setNote] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const formatCurrency = (value: number | string) =>
    `${new Intl.NumberFormat("vi-VN").format(Number(value || 0))}₫`;

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: 15 };
    if (status !== "all") params.status = status;

    try {
      const res = await adminApi.getWalletWithdrawals(params);
      const data = (res.data?.data || []) as ExtendedWithdrawalItem[];
      setWithdrawals(data);
      setTotalPages(res.data?.meta?.totalPages || 1);
      setTotalCount(res.data?.meta?.total || data.length);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Không tải được dữ liệu ví";
      toast({
        title: "Lỗi",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, status, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (
    item: ExtendedWithdrawalItem,
    action: "approve" | "reject"
  ) => {
    setActionLoading(item.id);
    try {
      if (action === "approve") {
        await adminApi.approveWalletWithdrawal(item.id, note.trim() || undefined);
        toast({ title: "Đã xác nhận chuyển tiền rút thành công" });
      } else {
        if (!note.trim()) {
          toast({
            title: "Thiếu lý do",
            description: "Vui lòng nhập ghi chú hoặc lý do từ chối",
            variant: "destructive",
          });
          return;
        }
        await adminApi.rejectWalletWithdrawal(item.id, note.trim());
        toast({ title: "Đã từ chối yêu cầu rút tiền" });
      }
      setSelected(null);
      setNote("");
      fetchRequests();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Thao tác thất bại";
      toast({
        title: "Lỗi",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <WalletCards className="w-6 h-6 text-blue-600" />
          <span>Quản Lý Ví & Yêu Cầu Rút Tiền</span>
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Xét duyệt chuyển khoản rút tiền của Thợ đối tác và giám sát giao dịch ví
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((filter) => {
            const active = status === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => {
                  setStatus(filter.value);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-slate-500">
          Tổng cộng: <strong>{totalCount}</strong> yêu cầu
        </span>
      </div>

      <Card className="shadow-sm border-slate-200">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-800">
            Danh sách yêu cầu rút tiền
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm">Đang tải danh sách...</p>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
              <AlertCircle className="h-10 w-10 text-slate-400 mb-2" />
              <p className="font-semibold text-sm">Không có yêu cầu nào</p>
              <p className="text-xs text-slate-400 mt-1">
                Chưa có yêu cầu rút tiền nào ở trạng thái này
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="px-5 py-3.5 text-xs text-slate-500 uppercase font-semibold">Mã</TableHead>
                  <TableHead className="px-5 py-3.5 text-xs text-slate-500 uppercase font-semibold">Thợ đối tác</TableHead>
                  <TableHead className="px-5 py-3.5 text-xs text-slate-500 uppercase font-semibold">Số tiền rút</TableHead>
                  <TableHead className="px-5 py-3.5 text-xs text-slate-500 uppercase font-semibold">Tài khoản nhận</TableHead>
                  <TableHead className="px-5 py-3.5 text-xs text-slate-500 uppercase font-semibold">Thời gian gửi</TableHead>
                  <TableHead className="px-5 py-3.5 text-xs text-slate-500 uppercase font-semibold">Trạng thái</TableHead>
                  <TableHead className="px-5 py-3.5 text-right text-xs text-slate-500 uppercase font-semibold">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100 text-slate-700">
                {withdrawals.map((item) => {
                  const statusInfo = statusConfig[item.status] || {
                    label: item.status,
                    className: "bg-slate-100 text-slate-700",
                    icon: null,
                  };

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <TableCell className="px-5 py-4 font-mono font-medium text-slate-900 tabular-nums">
                        #{item.id}
                      </TableCell>
                      <TableCell className="px-5 py-4 font-medium text-slate-900">
                        {item.provider?.fullName || `Thợ #${item.providerId}`}
                        <div className="text-xs text-slate-400 font-normal">
                          {item.provider?.phone ||
                            item.provider?.email ||
                            "Chưa có liên hệ"}
                        </div>
                      </TableCell>
                      <TableCell className="px-5 py-4 font-bold text-slate-900 tabular-nums">
                        {formatCurrency(item.amount)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-xs text-slate-600">
                        {item.bankName ? (
                          <div>
                            <div className="font-semibold text-slate-800">
                              {item.bankName}
                            </div>
                            <div className="font-mono text-slate-500 tabular-nums">
                              {item.bankAccountNumber}
                            </div>
                            <div className="text-slate-400 uppercase">
                              {item.bankAccountHolder}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">
                            Chưa cung cấp
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-xs text-slate-500 tabular-nums">
                        {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="px-5 py-4">
                        <Badge
                          variant="outline"
                          className={`gap-1.5 px-2.5 py-0.5 text-xs font-semibold ${statusInfo.className}`}
                        >
                          {statusInfo.icon}
                          <span>{statusInfo.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right">
                        {item.status === "PENDING" ? (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            onClick={() => {
                              setSelected(item);
                              setNote("");
                            }}
                          >
                            Xử lý
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Đã đóng
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <span className="text-xs text-slate-500">
                Trang {page} / {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="h-8 gap-1 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className="h-8 gap-1 text-xs"
                >
                  Sau
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Xử lý yêu cầu rút tiền #{selected?.id}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg bg-slate-50 p-3 space-y-2 border border-slate-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <User className="h-4 w-4" /> Thợ:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {selected.provider?.fullName ||
                      `Thợ #${selected.providerId}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4" /> Số tiền rút:
                  </span>
                  <span className="font-bold text-emerald-600 text-base">
                    {formatCurrency(selected.amount)}
                  </span>
                </div>
                {selected.bankName && (
                  <div className="pt-2 border-t border-slate-200">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" /> Thông tin thụ hưởng:
                    </div>
                    <div className="font-medium text-slate-800">
                      {selected.bankName} - {selected.bankAccountNumber}
                    </div>
                    <div className="text-xs text-slate-500 uppercase">
                      Chủ TK: {selected.bankAccountHolder}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ghi chú nội bộ / Lý do từ chối
                </label>
                <Textarea
                  placeholder="Nhập mã giao dịch chuyển khoản hoặc lý do nếu từ chối..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="text-sm min-h-[80px]"
                />
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
                  disabled={actionLoading !== null}
                  onClick={() => handleAction(selected, "reject")}
                >
                  {actionLoading === selected.id && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Từ chối yêu cầu
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                  disabled={actionLoading !== null}
                  onClick={() => handleAction(selected, "approve")}
                >
                  {actionLoading === selected.id && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Xác nhận đã chuyển tiền
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminWalletPage() {
  return (
    <AdminPermissionGuard permission={AdminPermission.WALLET_WITHDRAWAL_MANAGE}>
      <AdminWalletContent />
    </AdminPermissionGuard>
  );
}
