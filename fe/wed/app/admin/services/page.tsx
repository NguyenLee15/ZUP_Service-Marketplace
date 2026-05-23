'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: 'Chờ Duyệt', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ACTIVE: { label: 'Đã Duyệt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Từ Chối', color: 'bg-red-100 text-red-800', icon: XCircle },
  HIDDEN: { label: 'Đã Ẩn', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  DRAFT: { label: 'Nháp', color: 'bg-muted text-muted-foreground', icon: Clock },
};

export default function AdminServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchServices = () => {
    setLoading(true);
    const params: Record<string, any> = {};
    if (filterStatus !== 'all') params.status = filterStatus;
    adminApi.getServices(params)
      .then((res) => setServices(res.data.data || []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchServices(); }, [filterStatus]);

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      await adminApi.approveService(id);
      toast({ title: 'Đã duyệt dịch vụ' });
      setShowModal(false);
      fetchServices();
    } catch (err: any) {
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
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message, variant: 'destructive' });
    } finally { setActionLoading(false); }
  };

  const handleHide = async (id: number) => {
    try {
      await adminApi.hideService(id);
      toast({ title: 'Đã ẩn dịch vụ' });
      fetchServices();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message, variant: 'destructive' });
    }
  };

  const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + '₫';

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-foreground">Quản Lý Dịch Vụ</h3>
        <p className="text-muted-foreground mt-1">Duyệt và quản lý dịch vụ của nhà cung cấp</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'PENDING', 'ACTIVE', 'REJECTED', 'HIDDEN'].map((status) => (
          <Button key={status} variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => setFilterStatus(status)} size="sm" className="gap-1">
            <Filter className="w-3 h-3" />
            {status === 'all' ? 'Tất Cả' : statusConfig[status]?.label || status}
          </Button>
        ))}
      </div>

      {/* Services Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
          ) : services.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Không có dịch vụ nào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tên Dịch Vụ</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Nhà Cung Cấp</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Giá</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng Thái</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service: any) => {
                    const sc = statusConfig[service.status] || statusConfig.DRAFT;
                    const StatusIcon = sc.icon;
                    return (
                      <tr key={service.id} className="border-b border-border hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="font-medium text-foreground">{service.name}</p>
                              <p className="text-xs text-muted-foreground">{service.category?.name}</p>
                            </div>
                            {service.isSensitive && (
                              <Badge className="bg-rose-100 text-rose-700 border-0 hover:bg-rose-100/80 font-bold text-[10px] flex items-center gap-1 px-1.5 py-0.5 shrink-0 animate-pulse">
                                <AlertTriangle className="w-3 h-3" /> AI Warning
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{service.provider?.fullName}</td>
                        <td className="py-3 px-4 font-medium text-foreground">{formatPrice(Number(service.referencePrice))}</td>
                        <td className="py-3 px-4">
                          <Badge className={`${sc.color} border-0 text-xs`}>
                            <StatusIcon className="w-3 h-3 mr-1" /> {sc.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {Number(service.avgRating) > 0 ? (
                            <span className="font-medium">{Number(service.avgRating).toFixed(1)}</span>
                          ) : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedService(service); setShowModal(true); }}>
                              <Eye className="w-4 h-4 text-blue-600" />
                            </Button>
                            {service.status === 'ACTIVE' && (
                              <Button variant="ghost" size="sm" onClick={() => handleHide(service.id)}>
                                <XCircle className="w-4 h-4 text-orange-500" />
                              </Button>
                            )}
                          </div>
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

      {/* Detail Modal */}
      {showModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{selectedService.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedService.isSensitive && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-sm text-rose-800 animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Nội Dung Nhạy Cảm (AI Auto-Flagged)</h5>
                    <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                      Gemini phát hiện dịch vụ này chứa các từ khóa nghi ngờ lừa đảo, nhạy cảm hoặc vi phạm điều khoản của HomeServe. Nhân viên cần rà soát kỹ lưỡng.
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
                  <p className="text-muted-foreground">Giá</p>
                  <p className="font-medium">{formatPrice(Number(selectedService.referencePrice))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Danh Mục</p>
                  <p className="font-medium">{selectedService.category?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ngày Tạo</p>
                  <p className="font-medium">{new Date(selectedService.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Mô Tả</p>
                <p className="text-sm text-foreground/80 whitespace-pre-line">{selectedService.description}</p>
              </div>

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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
