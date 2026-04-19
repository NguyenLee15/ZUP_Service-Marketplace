'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  MessageSquare,
  File,
  Filter,
  RotateCcw,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Dispute {
  id: string;
  bookingId: string;
  customer: string;
  provider: string;
  service: string;
  status: 'open' | 'in_progress' | 'resolved';
  reason: string;
  submittedAt: string;
  lastUpdated: string;
  notes?: string;
  decision?: string;
  resolution?: string;
  undoCountdown?: number;
}

const mockDisputes: Dispute[] = [
  {
    id: 'DIS001',
    bookingId: 'BK001',
    customer: 'Nguyễn Văn A',
    provider: 'Tech Solutions',
    service: 'Thiết kế website',
    status: 'open',
    reason: 'Dịch vụ không đáp ứng yêu cầu',
    submittedAt: '2024-04-08',
    lastUpdated: '2024-04-08',
    notes: 'Khách hàng yêu cầu hoàn tiền 100%',
  },
  {
    id: 'DIS002',
    bookingId: 'BK002',
    customer: 'Trần Thị B',
    provider: 'Digital Marketing Pro',
    service: 'SEO tối ưu hóa',
    status: 'in_progress',
    reason: 'Không có kết quả sau 2 tháng',
    submittedAt: '2024-04-05',
    lastUpdated: '2024-04-09',
    notes: 'Đang chờ báo cáo từ nhà cung cấp',
  },
  {
    id: 'DIS003',
    bookingId: 'BK003',
    customer: 'Phạm Văn C',
    provider: 'Social Connect',
    service: 'Quản lý mạng xã hội',
    status: 'resolved',
    reason: 'Thanh toán bị lỗi',
    submittedAt: '2024-03-25',
    lastUpdated: '2024-04-01',
    decision: 'Hoàn tiền',
    resolution: 'Hoàn tiền 50% cho khách hàng',
    undoCountdown: undefined,
  },
  {
    id: 'DIS004',
    bookingId: 'BK004',
    customer: 'Hoàng Văn D',
    provider: 'Mobile First',
    service: 'Phát triển App iOS',
    status: 'resolved',
    reason: 'Tiến độ vượt quá dự kiến',
    submittedAt: '2024-03-18',
    lastUpdated: '2024-03-30',
    decision: 'Gia hạn thời gian',
    resolution: 'Gia hạn thêm 15 ngày',
    undoCountdown: 3,
  },
];

const statusConfig = {
  open: { label: 'Mở', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  in_progress: { label: 'Đang Xử Lý', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  resolved: { label: 'Đã Giải Quyết', color: 'bg-green-100 text-green-800', icon: CheckCircle },
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>(mockDisputes);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(disputes[0]);
  const [showUndoDialog, setShowUndoDialog] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredDisputes =
    filterStatus === 'all' ? disputes : disputes.filter((d) => d.status === filterStatus);

  const handleStatusChange = (status: string) => {
    setFilterStatus(status);
  };

  const handleUndo = () => {
    if (selectedDispute) {
      console.log('Undoing decision for dispute:', selectedDispute.id);
      alert('Quyết định đã được hoàn tác');
      setShowUndoDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Quản Lý Tranh Chấp</h3>
          <p className="text-gray-600 mt-1">
            {disputes.filter((d) => d.status === 'open').length} chưa xử lý
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'open', 'in_progress', 'resolved'].map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => handleStatusChange(status)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            {status === 'all'
              ? 'Tất Cả'
              : statusConfig[status as keyof typeof statusConfig]?.label}
          </Button>
        ))}
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Complaint List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Danh Sách Tranh Chấp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredDisputes.map((dispute) => {
                const statusInfo = statusConfig[dispute.status];
                const isSelected = selectedDispute?.id === dispute.id;

                return (
                  <button
                    key={dispute.id}
                    onClick={() => setSelectedDispute(dispute)}
                    className={`w-full text-left p-3 rounded-lg transition-colors border-2 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 mt-0.5 ${statusInfo?.color} flex-shrink-0`}>
                        {React.createElement(statusInfo?.icon || AlertTriangle, {
                          className: 'w-3 h-3',
                        })}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {dispute.id}
                        </p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {dispute.reason}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Column 2: Complaint Details */}
        {selectedDispute && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Chi Tiết Khiếu Nại</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Mã Tranh Chấp</p>
                <p className="font-mono font-medium text-gray-900">{selectedDispute.id}</p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Khách Hàng</p>
                <p className="font-medium text-gray-900">{selectedDispute.customer}</p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Nhà Cung Cấp</p>
                <p className="font-medium text-gray-900">{selectedDispute.provider}</p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Dịch Vụ</p>
                <p className="font-medium text-gray-900 text-sm">{selectedDispute.service}</p>
              </div>

              <div>
                <p className="text-xs text-gray-600 mb-1">Lý Do</p>
                <p className="text-sm text-gray-900 bg-red-50 p-2 rounded border border-red-200">
                  {selectedDispute.reason}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-gray-600">Ngày Gửi</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {selectedDispute.submittedAt}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Cập Nhật Lần Cuối</p>
                  <p className="font-medium text-gray-900 text-sm">
                    {selectedDispute.lastUpdated}
                  </p>
                </div>
              </div>

              {selectedDispute.notes && (
                <div>
                  <p className="text-xs text-gray-600 mb-1">Ghi Chú</p>
                  <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">
                    {selectedDispute.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Column 3: Decision & Resolution */}
        {selectedDispute && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Quyết Định & Giải Quyết</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-gray-600 mb-2">Trạng Thái</p>
                <div
                  className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 w-fit ${
                    statusConfig[selectedDispute.status]?.color
                  }`}
                >
                  {React.createElement(
                    statusConfig[selectedDispute.status]?.icon || AlertTriangle,
                    { className: 'w-4 h-4' }
                  )}
                  {statusConfig[selectedDispute.status]?.label}
                </div>
              </div>

              {selectedDispute.status === 'open' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Cần Quyết Định
                  </p>
                  <div className="space-y-2">
                    <Button className="w-full text-sm bg-green-600 hover:bg-green-700">
                      Phê Chuẩn Hoàn Tiền
                    </Button>
                    <Button variant="outline" className="w-full text-sm">
                      Từ Chối Yêu Cầu
                    </Button>
                    <Button variant="outline" className="w-full text-sm">
                      Đề Xuất Thỏa Thuận
                    </Button>
                  </div>
                </div>
              )}

              {selectedDispute.status === 'in_progress' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-yellow-900 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Đang Chờ Xử Lý
                  </p>
                  <Button variant="outline" className="w-full text-sm">
                    Gửi Yêu Cầu Bổ Sung
                  </Button>
                </div>
              )}

              {selectedDispute.status === 'resolved' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-3">
                  <div>
                    <p className="text-xs text-green-600 mb-1">Quyết Định</p>
                    <p className="font-medium text-green-900">{selectedDispute.decision}</p>
                  </div>

                  <div>
                    <p className="text-xs text-green-600 mb-1">Chi Tiết Giải Quyết</p>
                    <p className="text-sm text-green-900">{selectedDispute.resolution}</p>
                  </div>

                  {selectedDispute.undoCountdown !== undefined && (
                    <div className="bg-orange-50 p-2 rounded border border-orange-200">
                      <p className="text-xs text-orange-700 mb-2">
                        Có thể hoàn tác trong {selectedDispute.undoCountdown} ngày
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setShowUndoDialog(true)}
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Hoàn Tác Quyết Định
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Undo Dialog */}
      {showUndoDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-orange-600" />
                Hoàn Tác Quyết Định
              </CardTitle>
              <button
                onClick={() => setShowUndoDialog(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-900 font-medium mb-2">
                  Bạn chắc chắn muốn hoàn tác quyết định này?
                </p>
                <p className="text-sm text-orange-800">
                  Điều này sẽ quay lại trạng thái &quot;Đang Xử Lý&quot; và có thể thay đổi quyết định trước.
                </p>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowUndoDialog(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleUndo}
                >
                  Hoàn Tác
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
