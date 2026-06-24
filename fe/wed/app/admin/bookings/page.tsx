'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  AlertCircle,
  Loader2,
  ImageIcon,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi } from '@/features/auth/services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ Báo Giá', color: 'bg-yellow-100 text-yellow-800' },
  ACCEPTED: { label: 'Đã Tiếp Nhận', color: 'bg-blue-100 text-blue-800' },
  QUOTED: { label: 'Đã Báo Giá', color: 'bg-indigo-100 text-indigo-800' },
  CONFIRMED: { label: 'Đã Xác Nhận', color: 'bg-indigo-100 text-indigo-800' },
  IN_PROGRESS: { label: 'Đang Thực Hiện', color: 'bg-purple-100 text-purple-800' },
  DONE: { label: 'Hoàn Thành', color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Hoàn Thành', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Đã Hủy', color: 'bg-muted text-foreground' },
  DISPUTED: { label: 'Tranh Chấp', color: 'bg-red-100 text-red-800' },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<ApiPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<ApiPayload | null>(null);
  const [bookingDetail, setBookingDetail] = useState<ApiPayload | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (selectedBooking) {
      setDetailLoading(true);
      adminApi.getBookingDetail(selectedBooking.id)
        .then((res) => {
          setBookingDetail(res.data?.data || res.data);
        })
        .catch(() => setBookingDetail(null))
        .finally(() => setDetailLoading(false));
    } else {
      setBookingDetail(null);
    }
  }, [selectedBooking]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchBookings = () => {
    setLoading(true);
    const params: Record<string, any> = { page, limit: 10 };
    if (filterStatus !== 'all') params.status = filterStatus;
    
    adminApi.getBookings(params)
      .then((res) => {
        const data = res.data.data || [];
        setBookings(data);
        setTotalPages(res.data.meta?.totalPages || 1);
        if (data.length > 0 && !selectedBooking) {
          setSelectedBooking(data[0]);
        }
      })
      .catch(() => {
        setBookings([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookings(); }, [filterStatus, page]);

  const filteredBookings = bookings.filter((b) =>
    (b.bookingCode?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (b.customer?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (b.provider?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (b.service?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const formatPrice = (p: number) => new Intl.NumberFormat('vi-VN').format(p) + '₫';
  const getBookingPrice = (booking: ApiPayload) =>
    Number(booking?.quotation?.actualPrice ?? booking?.agreedPrice ?? 0);
  const getBookingDescription = (booking: ApiPayload) =>
    booking?.description || booking?.notes || 'Không có ghi chú chi tiết.';
  const canAdminCancel = (booking: ApiPayload) =>
    booking && !['CANCELLED', 'DONE', 'COMPLETED', 'DISPUTED'].includes(booking.status);

  const handleAdminCancel = async () => {
    if (!selectedBooking || cancelReason.trim().length < 10) return;
    setActionLoading(true);
    try {
      await adminApi.cancelBooking(selectedBooking.id, cancelReason.trim());
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedBooking(null);
      fetchBookings();
    } finally {
      setActionLoading(false);
    }
  };

    const displayBooking = bookingDetail || selectedBooking;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Quản Lý Đơn Hàng</h3>
          <p className="text-muted-foreground mt-1">Quản lý và theo dõi toàn bộ đơn hàng trên hệ thống</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo mã, khách hàng, nhà cung cấp hoặc dịch vụ…"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'PENDING', 'ACCEPTED', 'QUOTED', 'CONFIRMED', 'IN_PROGRESS', 'DONE', 'CANCELLED', 'DISPUTED'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              onClick={() => {
                setFilterStatus(status);
                setSelectedBooking(null);
                setPage(1);
              }}
              size="sm"
            >
              {status === 'all'
                ? 'Tất Cả'
                : statusConfig[status]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 2-Column Layout: List + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Bookings List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Danh Sách Đơn Hàng</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-muted rounded animate-pulse" />)}</div>
            ) : filteredBookings.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Không có đơn hàng nào</p>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                {filteredBookings.map((booking) => {
                  const statusInfo = statusConfig[booking.status] || { label: booking.status, color: 'bg-muted text-foreground' };
                  const isSelected = selectedBooking?.id === booking.id;

                  return (
                    <button
                      key={booking.id}
                      onClick={() => setSelectedBooking(booking)}
                      className={`w-full text-left p-3 rounded-lg transition-colors border-2 ${
                        isSelected
                          ? 'bg-blue-50 border-blue-500'
                          : 'bg-muted border-transparent hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-mono text-xs font-bold text-muted-foreground">#{booking.bookingCode}</p>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground truncate mb-1">{booking.service?.name}</p>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground truncate mr-2">KH: {booking.customer?.fullName}</span>
                        <span className="font-semibold text-foreground">{formatPrice(getBookingPrice(booking))}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            
            {!loading && filteredBookings.length > 0 && (
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

        {/* Column 2 & 3: Details View */}
        {displayBooking && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {detailLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  Đơn hàng #{displayBooking.bookingCode}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusConfig[displayBooking.status]?.color}`}>
                    {statusConfig[displayBooking.status]?.label}
                  </span>
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Ngày tạo: {new Date(displayBooking.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                {canAdminCancel(displayBooking) && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setCancelReason('');
                      setShowCancelModal(true);
                    }}
                  >
                    Hủy đơn đặc biệt
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Dịch Vụ</p>
                    <p className="font-medium text-foreground">{displayBooking.service?.name}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Tổng Tiền (Đã chốt)</p>
                    <p className="font-bold text-foreground text-lg">{formatPrice(getBookingPrice(displayBooking))}</p>
                    {displayBooking.quotations?.[0]?.commissionRateSnapshot && (
                      <p className="text-xs text-emerald-600 mt-1 font-medium">
                        Hoa hồng hệ thống ({displayBooking.quotations[0].commissionRateSnapshot}%): <br/>
                        +{formatPrice(getBookingPrice(displayBooking) * (Number(displayBooking.quotations[0].commissionRateSnapshot) / 100))}
                      </p>
                    )}
                  </div>
                  <div className="bg-muted p-4 rounded-lg col-span-2">
                    <p className="text-xs text-muted-foreground mb-1">Thời gian & Địa điểm</p>
                    <p className="font-medium text-foreground">Hẹn lúc: {displayBooking.desiredTime ? new Date(displayBooking.desiredTime).toLocaleString('vi-VN') : '---'}</p>
                    <p className="text-sm text-muted-foreground mt-1">Tại: {[displayBooking.addressDetail, displayBooking.ward, displayBooking.district, displayBooking.province].filter(Boolean).filter(p => p !== 'Không áp dụng').join(', ')}</p>
                    
                    {/* Lifecycle Timestamps */}
                    <div className="mt-3 flex gap-4 text-xs text-muted-foreground border-t border-border pt-2">
                      {displayBooking.providerAcceptedAt && (
                        <p><strong>Bắt đầu:</strong> {new Date(displayBooking.providerAcceptedAt).toLocaleString('vi-VN')}</p>
                      )}
                      {displayBooking.completedAt && (
                        <p><strong>Hoàn thành:</strong> {new Date(displayBooking.completedAt).toLocaleString('vi-VN')}</p>
                      )}
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Khách Hàng</p>
                    <p className="font-medium text-foreground">{displayBooking.customer?.fullName}</p>
                    <p className="text-sm text-muted-foreground">{displayBooking.customer?.phone || displayBooking.customer?.email}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Nhà Cung Cấp</p>
                    <p className="font-medium text-foreground">{displayBooking.provider?.fullName}</p>
                    <p className="text-sm text-muted-foreground">{displayBooking.provider?.phone || displayBooking.provider?.email}</p>
                  </div>
                </div>

                {displayBooking.quotations?.[0]?.quotationItems?.length > 0 ? (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-foreground mb-3">Hạng mục đã báo giá</h4>
                    <ul className="space-y-2">
                      {displayBooking.quotations[0].quotationItems.map((item: any) => (
                        <li key={item.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 border-gray-100">
                          <span>{item.itemName} <span className="text-muted-foreground">(x{item.quantity})</span></span>
                          <span className="font-medium">{formatPrice(Number(item.unitPrice) * Number(item.quantity))}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : displayBooking.bookingItems?.length > 0 ? (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-foreground mb-3">Hạng mục dịch vụ yêu cầu</h4>
                    <ul className="space-y-2">
                      {displayBooking.bookingItems.map((item: any) => (
                        <li key={item.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 border-gray-100">
                          <span>{item.serviceItem?.name || 'Hạng mục'} <span className="text-muted-foreground">(x{item.quantity})</span></span>
                          <span className="font-medium">{formatPrice(Number(item.price) * Number(item.quantity))}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="border-t pt-4">
                  <h4 className="font-medium text-foreground mb-3">Chi tiết công việc</h4>
                  <div className="bg-muted p-4 rounded-lg text-sm text-foreground/80 whitespace-pre-wrap">
                    {getBookingDescription(displayBooking)}
                  </div>
                </div>
                    {/* Images / Attachments */}
                    {displayBooking.attachments && displayBooking.attachments.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" /> Hình ảnh đính kèm
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {displayBooking.attachments.map((att: any) => (
                            <div key={att.id} className="relative aspect-square rounded-lg overflow-hidden border border-border group bg-muted">
                              <img src={att.fileUrl} alt={att.type} className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1">
                                <p className="text-[10px] text-white text-center font-medium">
                                  {att.type === 'RESULT' ? 'Nghiệm thu' : 'Khảo sát'}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Quote Note */}
                    {displayBooking.quotations?.[0]?.note && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4" /> Ghi chú báo giá
                        </h4>
                        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-900 border border-blue-100 whitespace-pre-wrap">
                          {displayBooking.quotations[0].note}
                        </div>
                      </div>
                    )}
      

                {displayBooking.statusHistories && displayBooking.statusHistories.find((h: any) => h.toStatus === 'CANCELLED') && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Lý do hủy đơn
                    </h4>
                    <div className="bg-red-50 p-4 rounded-lg text-sm text-red-800 border border-red-100 whitespace-pre-wrap flex flex-col gap-1">
                      {(() => {
                        const cancelHistory = displayBooking.statusHistories.find((h: any) => h.toStatus === 'CANCELLED');
                        let cancelledByRole = "";
                        if (cancelHistory?.changedBy === displayBooking.customer?.id) {
                          cancelledByRole = "Khách hàng hủy";
                        } else if (cancelHistory?.changedBy === displayBooking.provider?.id) {
                          cancelledByRole = "Nhà cung cấp hủy";
                        } else if (cancelHistory?.changedBy) {
                          cancelledByRole = "Hệ thống/Quản trị viên hủy";
                        }

                        const reason = cancelHistory?.note || displayBooking.cancellationReason || "Không có lý do";
                        return (
                          <>
                            {cancelledByRole && <span className="font-semibold text-red-900">[{cancelledByRole}]</span>}
                            <span>{reason}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={showCancelModal && Boolean(selectedBooking)}
        onOpenChange={(open) => {
          setShowCancelModal(open);
          if (!open) setCancelReason('');
        }}
      >
        {selectedBooking && (
          <DialogContent className="w-full max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Hủy đơn đặc biệt
              </DialogTitle>
              <DialogDescription>
                Chỉ dùng khi khách hàng hoặc thợ yêu cầu hủy trong trường hợp đặc biệt.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium text-foreground">
                  #{selectedBooking.bookingCode} · {selectedBooking.service?.name}
                </p>
                <p className="text-muted-foreground">
                  Lý do sẽ được lưu vào lịch sử đơn và dùng để thông báo cho các bên.
                </p>
              </div>
              <label htmlFor="admin-cancel-reason" className="block text-sm font-medium text-foreground/80">
                Lý do hủy
                <textarea
                  id="admin-cancel-reason"
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  placeholder="Ví dụ: khách hàng báo trùng lịch và yêu cầu hủy đơn…"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  aria-invalid={cancelReason.trim().length > 0 && cancelReason.trim().length < 10}
                  aria-describedby={
                    cancelReason.trim().length > 0 && cancelReason.trim().length < 10
                      ? 'admin-cancel-reason-help'
                      : undefined
                  }
                />
              </label>
              {cancelReason.trim().length > 0 && cancelReason.trim().length < 10 && (
                <p id="admin-cancel-reason-help" className="text-sm text-red-600">Lý do cần ít nhất 10 ký tự.</p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCancelModal(false)}>
                  Đóng
                </Button>
                <Button
                  variant="destructive"
                  disabled={actionLoading || cancelReason.trim().length < 10}
                  onClick={handleAdminCancel}
                >
                  Xác nhận hủy
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
