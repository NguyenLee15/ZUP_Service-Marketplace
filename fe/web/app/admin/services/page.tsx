'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
  Search,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';
import { AdminPermissionGuard } from '@/features/admin/components/AdminPermissionGuard';
import { AdminPermission } from '@/types/admin-permissions';

const statusConfig: Record<string, { label: string; color: string; icon: ApiPayload }> = {
  PENDING: { label: 'Chờ Duyệt', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ACTIVE: { label: 'Đã Duyệt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Từ Chối', color: 'bg-red-100 text-red-800', icon: XCircle },
  HIDDEN: { label: 'Đã Ẩn', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  DRAFT: { label: 'Nháp', color: 'bg-muted text-muted-foreground', icon: Clock },
};

export default function AdminServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<ApiPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedService, setSelectedService] = useState<ApiPayload>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchServices = () => {
    setLoading(true);
    const params: Record<string, any> = { page, limit: 10 };
    if (filterStatus !== 'all') params.status = filterStatus;
    adminApi.getServices(params)
      .then((res) => {
        setServices(res.data.data || []);
        setTotalPages(res.data.meta?.totalPages || 1);
      })
      .catch(() => {
        setServices([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchServices(); }, [filterStatus, page]);

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      await adminApi.approveService(id);
      toast({ title: 'Đã duyệt dịch vụ' });
      setShowModal(false);
      fetchServices();
    } catch (err: ApiPayload) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message, variant: 'destructive' });
    } finally { setActionLoading(false); }
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
    } finally { setActionLoading(false); }
  };

  const handleHide = async (id: number) => {
    try {
      await adminApi.hideService(id);
      toast({ title: 'Đã ẩn dịch vụ' });
      fetchServices();
    } catch (err: ApiPayload) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message, variant: 'destructive' });
    }
  };

  const handleShow = async (id: number) => {
    try {
      await adminApi.showService(id);
      toast({ title: 'Đã mở ẩn dịch vụ' });
      fetchServices();
    } catch (err: ApiPayload) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message, variant: 'destructive' });
    }
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + '₫';

  const filteredServices = services.filter((s: ApiPayload) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (s.name?.toLowerCase() || '').includes(q) ||
      (s.provider?.fullName?.toLowerCase() || '').includes(q)
    );
  });

  return (
    <AdminPermissionGuard permission={AdminPermission.SERVICE_MODERATE}>
      <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-foreground">Quản Lý Dịch Vụ</h3>
        <p className="text-muted-foreground mt-1">Duyệt và quản lý dịch vụ của nhà cung cấp</p>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-wrap">
          {['all', 'PENDING', 'ACTIVE', 'REJECTED', 'HIDDEN'].map((status) => (
            <Button key={status} variant={filterStatus === status ? 'default' : 'outline'}
              onClick={() => { setFilterStatus(status); setPage(1); }} size="sm" className="gap-1">
              <Filter className="w-3 h-3" />
              {status === 'all' ? 'Tất Cả' : statusConfig[status]?.label || status}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm dịch vụ, thợ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      {/* Services Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
          ) : services.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Không có dịch vụ nào</p>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="text-left py-3 px-4 font-semibold text-xs uppercase text-slate-500">Tên Dịch Vụ</TableHead>
                  <TableHead className="text-left py-3 px-4 font-semibold text-xs uppercase text-slate-500">Nhà Cung Cấp</TableHead>
                  <TableHead className="text-left py-3 px-4 font-semibold text-xs uppercase text-slate-500">Giá từ</TableHead>
                  <TableHead className="text-left py-3 px-4 font-semibold text-xs uppercase text-slate-500">Trạng Thái</TableHead>
                  <TableHead className="text-left py-3 px-4 font-semibold text-xs uppercase text-slate-500">Rating</TableHead>
                  <TableHead className="text-left py-3 px-4 font-semibold text-xs uppercase text-slate-500">Hành Động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service: ApiPayload) => {
                  const sc = statusConfig[service.status] || statusConfig.DRAFT;
                  const StatusIcon = sc.icon;
                  return (
                    <TableRow key={service.id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-foreground">{service.name}</p>
                            <p className="text-xs text-muted-foreground">{service.category?.name}</p>
                          </div>
                          {service.isSensitive && (
                            <Badge className="bg-rose-100 text-rose-700 border-0 hover:bg-rose-100/80 font-bold text-[10px] flex items-center gap-1 px-1.5 py-0.5 shrink-0 animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> Cần xem xét
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-4 text-gray-700">{service.provider?.fullName}</TableCell>
                      <TableCell className="py-3 px-4 font-medium text-foreground tabular-nums">{formatPrice(Number(service.referencePrice))}</TableCell>
                      <TableCell className="py-3 px-4">
                        <Badge className={`${sc.color} border-0 text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" /> {sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 px-4 tabular-nums">
                        {Number(service.avgRating) > 0 ? (
                          <span className="font-medium">{Number(service.avgRating).toFixed(1)}</span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedService(service); setShowModal(true); }}>
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          {service.status === 'ACTIVE' && (
                            <Button variant="ghost" size="sm" onClick={() => handleHide(service.id)} title="Ẩn dịch vụ">
                              <XCircle className="w-4 h-4 text-orange-500" />
                            </Button>
                          )}
                          {service.status === 'HIDDEN' && (
                            <Button variant="ghost" size="sm" onClick={() => handleShow(service.id)} title="Mở ẩn dịch vụ">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          
          {!loading && services.length > 0 && (
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Trang {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Trước
                </Button>
                <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) setRejectReason(''); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedService && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedService.name}</DialogTitle>
                <DialogDescription>
                  Chi tiết dịch vụ và thông tin nhà cung cấp
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {selectedService.isSensitive && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-sm text-rose-800">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold">Nội Dung Cần Lưu Ý (Kiểm Duyệt Tự Động)</h5>
                      <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                        Hệ thống kiểm duyệt tự động phát hiện dịch vụ này chứa từ khóa cần xác minh theo quy chuẩn ZUP. Vui lòng rà soát kỹ lưỡng trước khi phê duyệt.
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Nhà Cung Cấp</p>
                    <p className="font-medium">{selectedService.provider?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Giá từ</p>
                    <p className="font-medium tabular-nums">{formatPrice(Number(selectedService.referencePrice))}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Danh Mục</p>
                    <p className="font-medium">{selectedService.category?.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Ngày Tạo</p>
                    <p className="font-medium tabular-nums">{selectedService.createdAt ? new Date(selectedService.createdAt).toLocaleDateString('vi-VN') : '—'}</p>
                  </div>
                </div>

                <div>
                  <p className="text-muted-foreground text-sm mb-1">Mô Tả</p>
                  <p className="text-sm text-foreground/80 whitespace-pre-line">{selectedService.description}</p>
                </div>

                {selectedService.images?.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Hình Ảnh</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {selectedService.images.map((img: any) => (
                        <img key={img.id} src={img.imageUrl} alt="service image" className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
                      ))}
                    </div>
                  </div>
                )}

                {selectedService.items?.length > 0 && (
                  <div>
                    <p className="text-muted-foreground text-sm mb-2">Các Hạng Mục Dịch Vụ</p>
                    <div className="bg-muted p-3 rounded-lg space-y-2">
                      {selectedService.items.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 border-gray-200">
                          <span>{item.name}</span>
                          <span className="font-medium tabular-nums">{formatPrice(Number(item.price))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedService.status === 'PENDING' && (
                  <div className="space-y-3 border-t pt-4">
                    <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Lý do từ chối (nếu từ chối)..." rows={2} />
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button variant="outline" onClick={() => { setShowModal(false); setRejectReason(''); }}>
                    Đóng
                  </Button>
                  {selectedService.status === 'PENDING' && (
                    <>
                      <Button className="bg-green-600 hover:bg-green-700" disabled={actionLoading}
                        onClick={() => handleApprove(selectedService.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Duyệt
                      </Button>
                      <Button variant="destructive" disabled={!rejectReason || actionLoading}
                        onClick={() => handleReject(selectedService.id)}>
                        <XCircle className="w-4 h-4 mr-1" /> Từ Chối
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </AdminPermissionGuard>
  );
}
