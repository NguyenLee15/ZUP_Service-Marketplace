'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ZoomIn,
  ZoomOut,
  RotateCw,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';
import { Textarea } from '@/components/ui/textarea';

const statusConfig: Record<string, { label: string; color: string; icon: ApiPayload }> = {
  PENDING: { label: 'Chờ Duyệt', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  APPROVED: { label: 'Đã Duyệt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Từ Chối', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function KYCPage() {
  const { toast } = useToast();
  const [kycList, setKycList] = useState<ApiPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const [selectedKYC, setSelectedKYC] = useState<ApiPayload | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [selectedImage, setSelectedImage] = useState<'front' | 'back' | 'portrait'>('front');
  
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchKyc = () => {
    setLoading(true);
    const params: Record<string, ApiPayload> = {};
    if (filterStatus !== 'all') params.status = filterStatus;
    // Tạm thời chưa có filter keyword ở backend cho kyc nhưng có thể filter ở frontend sau
    adminApi.getKycRequests(params)
      .then((res) => setKycList(res.data.data || []))
      .catch(() => setKycList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchKyc(); }, [filterStatus]);

  const filteredKYC = kycList.filter((k) =>
    (k.provider?.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (k.provider?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleApprove = async () => {
    if (!selectedKYC) return;
    setActionLoading(true);
    try {
      await adminApi.approveKyc(selectedKYC.id);
      toast({ title: 'Đã duyệt hồ sơ KYC' });
      setShowDetailModal(false);
      setSelectedKYC(null);
      fetchKyc();
    } catch (err: ApiPayload) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedKYC || !rejectReason) return;
    setActionLoading(true);
    try {
      await adminApi.rejectKyc(selectedKYC.id, rejectReason);
      toast({ title: 'Đã từ chối hồ sơ KYC' });
      setShowDetailModal(false);
      setSelectedKYC(null);
      setRejectReason('');
      fetchKyc();
    } catch (err: ApiPayload) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const getImageSrc = () => {
    if (!selectedKYC) return '';
    if (selectedImage === 'front') return selectedKYC.cccdFrontUrl;
    if (selectedImage === 'back') return selectedKYC.cccdBackUrl;
    if (selectedImage === 'portrait') return selectedKYC.portraitUrl;
    return '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Quản Lý KYC</h3>
          <p className="text-muted-foreground mt-1">
            {kycList.filter((k) => k.status === 'PENDING').length} đang chờ duyệt
          </p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {['all', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              onClick={() => setFilterStatus(status)}
              size="sm"
            >
              {status === 'all'
                ? 'Tất Cả'
                : statusConfig[status]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* KYC Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
          ) : filteredKYC.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Không có hồ sơ KYC nào</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tên</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">SĐT</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng Thái</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày Gửi</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKYC.map((kyc) => {
                    const statusInfo = statusConfig[kyc.status] || statusConfig.PENDING;
                    const StatusIcon = statusInfo?.icon;

                    return (
                      <tr
                        key={kyc.id}
                        className={`border-b border-border hover:bg-muted ${
                          kyc.status === 'PENDING' ? 'bg-yellow-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-foreground">{kyc.provider?.fullName}</p>
                            <p className="text-xs text-muted-foreground">ID: {kyc.id}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-700">{kyc.provider?.email}</td>
                        <td className="py-3 px-4 text-gray-700">{kyc.provider?.phone}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${statusInfo?.color}`}>
                            {StatusIcon && <StatusIcon className="w-3 h-3" />}
                            {statusInfo?.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(kyc.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedKYC(kyc);
                              setShowDetailModal(true);
                              setImageZoom(1);
                              setImageRotation(0);
                              setSelectedImage('front');
                              setRejectReason('');
                            }}
                          >
                            Xem Chi Tiết
                          </Button>
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
      {showDetailModal && selectedKYC && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between border-b">
              <CardTitle>Chi Tiết KYC - {selectedKYC.provider?.fullName}</CardTitle>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedKYC(null);
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Images */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Ảnh Chứng Thực</h4>
                  
                  {/* Image Viewer */}
                  <div className="border-2 border-border rounded-lg overflow-hidden bg-gray-50">
                    <div className="relative h-80 flex items-center justify-center overflow-hidden">
                      <div
                        className="transition-transform"
                        style={{
                          transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                        }}
                      >
                        {getImageSrc() ? (
                          <img src={getImageSrc()} alt="KYC" className="max-w-full max-h-80 object-contain" />
                        ) : (
                          <div className="w-64 h-64 bg-gray-300 rounded-lg flex items-center justify-center text-white">
                            Không có ảnh
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Image Controls */}
                    <div className="flex items-center justify-between gap-2 p-3 border-t border-border bg-white">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setImageZoom(Math.max(imageZoom - 0.2, 0.5))}
                        >
                          <ZoomOut className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium w-12 text-center">{(imageZoom * 100).toFixed(0)}%</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setImageZoom(Math.min(imageZoom + 0.2, 3))}
                        >
                          <ZoomIn className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImageRotation((imageRotation + 90) % 360)}
                      >
                        <RotateCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Image Selection Tabs */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'front', label: 'Mặt Trước' },
                      { key: 'back', label: 'Mặt Sau' },
                      { key: 'portrait', label: 'Chân Dung' },
                    ].map((img) => (
                      <button
                        key={img.key}
                        onClick={() => {
                          setSelectedImage(img.key as 'front' | 'back' | 'portrait');
                          setImageZoom(1);
                          setImageRotation(0);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          selectedImage === img.key
                            ? 'bg-blue-600 text-white'
                            : 'bg-muted text-foreground/80 hover:bg-gray-300'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right Column - Information */}
                <div className="space-y-4">
                  <h4 className="font-medium text-foreground">Thông Tin Cá Nhân</h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-muted p-3 rounded-lg col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Họ Tên</p>
                      <p className="font-medium text-foreground">{selectedKYC.provider?.fullName}</p>
                    </div>

                    <div className="bg-muted p-3 rounded-lg col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Email</p>
                      <p className="font-medium text-foreground break-all">{selectedKYC.provider?.email}</p>
                    </div>

                    <div className="bg-muted p-3 rounded-lg col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Số Điện Thoại</p>
                      <p className="font-medium text-foreground">{selectedKYC.provider?.phone}</p>
                    </div>

                    <div className="bg-muted p-3 rounded-lg col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Ngày Gửi</p>
                      <p className="font-medium text-foreground">{new Date(selectedKYC.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>

                  {selectedKYC.status === 'REJECTED' && selectedKYC.rejectReason && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <p className="text-xs text-red-600 mb-1">Lý do từ chối:</p>
                      <p className="font-medium text-red-900">{selectedKYC.rejectReason}</p>
                    </div>
                  )}

                  {selectedKYC.status === 'PENDING' && (
                    <div className="space-y-2 pt-2">
                      <label className="text-sm font-medium">Lý do từ chối (nếu có)</label>
                      <Textarea 
                        value={rejectReason} 
                        onChange={(e) => setRejectReason(e.target.value)} 
                        placeholder="Nhập lý do từ chối..."
                        rows={2}
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowDetailModal(false);
                        setSelectedKYC(null);
                      }}
                      className="flex-1"
                    >
                      Đóng
                    </Button>
                    {selectedKYC.status === 'PENDING' && (
                      <>
                        <Button
                          variant="destructive"
                          onClick={handleReject}
                          disabled={!rejectReason || actionLoading}
                          className="flex-1"
                        >
                          Từ Chối
                        </Button>
                        <Button
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={handleApprove}
                          disabled={actionLoading}
                        >
                          Duyệt
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
