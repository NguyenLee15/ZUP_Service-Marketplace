'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminApi } from '@/features/auth/services/api';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Scale,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { AdminPermissionGuard } from '@/features/admin/components/AdminPermissionGuard';
import { AdminPermission } from '@/types/admin-permissions';

export default function AdminDisputesPage() {
  const router = useRouter();
  const requestIdRef = useRef(0);
  const [disputes, setDisputes] = useState<ApiPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'RESOLVED' | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDisputes = useCallback(async () => {
    const currentRequestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const res = await adminApi.getDisputes(params);
      if (currentRequestId !== requestIdRef.current) return;
      setDisputes(res.data?.data || []);
      setTotalPages(res.data?.meta?.totalPages || 1);
    } catch (err: unknown) {
      if (currentRequestId !== requestIdRef.current) return;
      setDisputes([]);
      setTotalPages(1);
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Không thể tải danh sách khiếu nại';
      setError(msg);
      toast.error(msg);
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  const formatDate = (d: string) => new Date(d).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  const filteredDisputes = disputes.filter(d => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (d.booking?.bookingCode?.toLowerCase() || '').includes(q) ||
      (d.booking?.customer?.fullName?.toLowerCase() || '').includes(q) ||
      (d.booking?.provider?.fullName?.toLowerCase() || '').includes(q)
    );
  });

  return (
    <AdminPermissionGuard permission={AdminPermission.DISPUTE_VIEW}>
      <div className="mx-auto max-w-[1600px] space-y-7 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">
            Quản Lý Tranh Chấp & Khiếu Nại
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Xem hồ sơ, đối chiếu chứng cứ và đưa ra phán quyết tối hậu giải quyết mâu thuẫn.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:items-center">
          <div className="relative w-full sm:w-64 mb-2 sm:mb-0">
            <label htmlFor="admin-disputes-search" className="sr-only">
              Tìm kiếm khiếu nại
            </label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="admin-disputes-search"
              aria-label="Tìm kiếm theo mã đơn, khách hàng hoặc thợ"
              placeholder="Tìm mã đơn, khách, thợ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm rounded-lg"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Bộ lọc trạng thái khiếu nại">
          {[
            { value: '', label: 'Tất cả' },
            { value: 'PENDING', label: 'Đang chờ xử lý' },
            { value: 'RESOLVED', label: 'Đã giải quyết' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={statusFilter === option.value}
              onClick={() => setStatusFilter(option.value as ApiPayload)}
              className={`h-9 rounded-lg border px-4 text-xs font-bold transition-all ${
                statusFilter === option.value
                  ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/10'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 rounded-xl bg-white border border-rose-200 shadow-sm space-y-3">
          <AlertTriangle className="w-10 h-10 mx-auto text-rose-500" />
          <p className="font-semibold text-slate-800 text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchDisputes} className="font-medium">
            Thử lại
          </Button>
        </div>
      ) : filteredDisputes.length === 0 ? (
        <div className="text-center py-16 rounded-xl bg-white border border-slate-200 shadow-sm">
          <CheckCircle className="w-10 h-10 mx-auto mb-3 text-slate-400" />
          <p className="font-semibold text-slate-800 text-sm">Hiện không có khiếu nại hoặc tranh chấp nào</p>
          <p className="text-xs text-slate-400 mt-1">Tất cả các đơn đặt dịch vụ đang diễn ra bình thường.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDisputes.map((d: ApiPayload) => {
              const isResolved = d.status === 'RESOLVED';
              const booking = d.booking || {};
              const service = booking.service || {};
              const customer = booking.customer || {};
              const provider = booking.provider || {};

              return (
                <Card
                  key={d.id}
                  className={`hover:shadow-md transition-all duration-200 rounded-2xl border ${
                    isResolved ? 'border-slate-200/60 bg-white' : 'border-rose-200 bg-rose-50/10'
                  }`}
                >
                  <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isResolved ? 'bg-slate-100 text-slate-600' : 'bg-rose-100 text-rose-600 shadow-sm'
                        }`}>
                          {isResolved ? <Scale className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5 animate-pulse" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-semibold text-slate-400">#{booking.bookingCode || 'N/A'}</span>
                            <Badge className={`border-0 text-[10px] font-bold ${
                              isResolved ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {isResolved ? 'Đã phân định' : 'Chờ phân xử'}
                            </Badge>
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 truncate mt-0.5">
                            {service.name || 'Dịch vụ đã bị xóa'}
                          </h4>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm gap-1.5"
                        onClick={() => router.push(`/admin/disputes/${d.id}`)}
                      >
                        <Eye className="w-3.5 h-3.5" /> Chi tiết
                      </Button>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs font-medium space-y-1">
                      <p className="text-slate-700 leading-relaxed truncate">
                        <span className="text-slate-400 font-semibold mr-1">Lý do khiếu nại:</span>
                        &ldquo;{d.reason}&rdquo;
                      </p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Yêu cầu lúc: {formatDate(d.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span className="truncate">KH: <strong>{customer.fullName || 'Ẩn danh'}</strong></span>
                      <span className="shrink-0 text-slate-300 mx-2">|</span>
                      <span className="truncate">Thợ: <strong>{provider.fullName || 'Ẩn danh'}</strong></span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4">
              <p className="text-xs text-muted-foreground">
                Trang {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Trước
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </AdminPermissionGuard>
  );
}
