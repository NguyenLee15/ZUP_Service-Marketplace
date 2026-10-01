'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';
import { AdminPermissionGuard } from '@/features/admin/components/AdminPermissionGuard';
import { AdminActionConfirmDialog } from '@/features/admin/components/AdminActionConfirmDialog';
import {
  AdminServicesTable,
  type ServiceAction,
} from '@/features/admin/services/components/AdminServicesTable';
import { AdminServiceDetailDialog } from '@/features/admin/services/components/AdminServiceDetailDialog';
import { AdminPermission } from '@/types/admin-permissions';

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ Duyệt',
  ACTIVE: 'Đã Duyệt',
  REJECTED: 'Từ Chối',
  HIDDEN: 'Đã Ẩn',
};

export default function AdminServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<ApiPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [selectedService, setSelectedService] = useState<ApiPayload>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirmation, setConfirmation] = useState<{
    action: ServiceAction;
    id: number;
  } | null>(null);
  const fetchRequestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchTerm.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchServices = useCallback(() => {
    const currentRequestId = ++fetchRequestIdRef.current;
    setLoading(true);
    setError(null);
    const params: Record<string, string | number> = { page, limit: 10 };
    if (filterStatus !== 'all') params.status = filterStatus;
    if (debouncedKeyword) params.keyword = debouncedKeyword;

    adminApi
      .getServices(params)
      .then((res) => {
        if (currentRequestId === fetchRequestIdRef.current) {
          setServices(res.data.data || []);
          setTotalPages(res.data.meta?.totalPages || 1);
        }
      })
      .catch((err: ApiPayload) => {
        if (currentRequestId === fetchRequestIdRef.current) {
          setServices([]);
          setTotalPages(1);
          setError(err?.response?.data?.error?.message || 'Không thể tải danh sách dịch vụ');
        }
      })
      .finally(() => {
        if (currentRequestId === fetchRequestIdRef.current) setLoading(false);
      });
  }, [debouncedKeyword, filterStatus, page]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      await adminApi.approveService(id);
      toast({ title: 'Đã duyệt dịch vụ' });
      setShowModal(false);
      fetchServices();
    } catch (err: ApiPayload) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectReason) return;
    setActionLoading(true);
    try {
      await adminApi.rejectService(id, rejectReason);
      toast({ title: 'Đã từ chối dịch vụ' });
      setShowModal(false);
      setRejectReason('');
      fetchServices();
    } catch (err: ApiPayload) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggle = async (id: number, action: 'hide' | 'show') => {
    setTogglingId(id);
    try {
      if (action === 'hide') await adminApi.hideService(id);
      else await adminApi.showService(id);
      toast({ title: action === 'hide' ? 'Đã ẩn dịch vụ' : 'Đã mở ẩn dịch vụ' });
      fetchServices();
    } catch (err: ApiPayload) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message, variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  };

  const confirmAction = async () => {
    if (!confirmation) return;
    const { action, id } = confirmation;
    setConfirmation(null);
    if (action === 'approve') await handleApprove(id);
    if (action === 'reject') await handleReject(id);
    if (action === 'hide' || action === 'show') await handleToggle(id, action);
  };

  return (
    <AdminPermissionGuard permission={AdminPermission.SERVICE_MODERATE}>
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Quản Lý Dịch Vụ</h1>
          <p className="text-muted-foreground mt-1 text-sm">Duyệt và quản lý dịch vụ của nhà cung cấp</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Bộ lọc trạng thái dịch vụ">
            {['all', 'PENDING', 'ACTIVE', 'REJECTED', 'HIDDEN'].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                aria-pressed={filterStatus === status}
                onClick={() => { setFilterStatus(status); setPage(1); }}
                size="sm"
                className="gap-1"
              >
                <Filter className="w-3 h-3" />
                {status === 'all' ? 'Tất Cả' : statusLabels[status] || status}
              </Button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <label htmlFor="admin-services-search" className="sr-only">Tìm kiếm dịch vụ</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="admin-services-search"
              aria-label="Tìm dịch vụ hoặc tên thợ"
              placeholder="Tìm dịch vụ, thợ..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        <AdminServicesTable
          services={services}
          loading={loading}
          error={error}
          page={page}
          totalPages={totalPages}
          togglingId={togglingId}
          onRetry={fetchServices}
          onPageChange={setPage}
          onSelectService={(service) => { setSelectedService(service); setShowModal(true); }}
          onConfirmAction={(action, id) => setConfirmation({ action, id })}
        />

        <AdminServiceDetailDialog
          service={selectedService}
          open={showModal}
          rejectReason={rejectReason}
          actionLoading={actionLoading}
          onOpenChange={(open) => { setShowModal(open); if (!open) setRejectReason(''); }}
          onRejectReasonChange={setRejectReason}
          onConfirmAction={(action, id) => setConfirmation({ action, id })}
        />

        <AdminActionConfirmDialog
          open={confirmation !== null}
          onOpenChange={(open) => {
            if (!open && !actionLoading && !togglingId) setConfirmation(null);
          }}
          title={
            confirmation?.action === 'approve' ? 'Duyệt dịch vụ?' :
              confirmation?.action === 'reject' ? 'Từ chối dịch vụ?' :
                confirmation?.action === 'hide' ? 'Ẩn dịch vụ?' : 'Hiện dịch vụ?'
          }
          description="Thao tác này sẽ thay đổi trạng thái hiển thị của dịch vụ trong hệ thống. Vui lòng xác nhận trước khi tiếp tục."
          confirmLabel={confirmation?.action === 'reject' || confirmation?.action === 'hide' ? 'Xác nhận thay đổi' : 'Xác nhận'}
          destructive={confirmation?.action === 'reject' || confirmation?.action === 'hide'}
          loading={actionLoading || togglingId !== null}
          onConfirm={confirmAction}
        />
      </div>
    </AdminPermissionGuard>
  );
}
