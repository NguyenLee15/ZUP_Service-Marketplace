'use client';

import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  MoreVertical,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Service {
  id: string;
  name: string;
  provider: string;
  category: string;
  price: string;
  status: 'pending' | 'approved' | 'rejected' | 'timeout';
  rating: number;
  reviews: number;
  submittedAt: string;
  hasViolations: boolean;
  violations?: string[];
  timeoutHours?: number;
}

const mockServices: Service[] = [
  {
    id: 'SV001',
    name: 'Thiết Kế Website Responsive',
    provider: 'Tech Solutions',
    category: 'Phát Triển Web',
    price: '10,000,000 VNĐ',
    status: 'approved',
    rating: 4.8,
    reviews: 24,
    submittedAt: '2024-04-05',
    hasViolations: false,
  },
  {
    id: 'SV002',
    name: 'SEO Tối Ưu Hóa',
    provider: 'Digital Marketing Pro',
    category: 'Marketing',
    price: '5,000,000 VNĐ',
    status: 'timeout',
    rating: 4.5,
    reviews: 18,
    submittedAt: '2024-04-02',
    hasViolations: false,
    timeoutHours: 18,
  },
  {
    id: 'SV003',
    name: 'Quản Lý Mạng Xã Hội',
    provider: 'Social Connect',
    category: 'Marketing',
    price: '8,000,000 VNĐ',
    status: 'pending',
    rating: 0,
    reviews: 0,
    submittedAt: '2024-04-10',
    hasViolations: true,
    violations: [
      'Giá không phù hợp với mô tả',
      'Ảnh không đạt tiêu chuẩn',
      'Mô tả quá ngắn',
    ],
  },
  {
    id: 'SV004',
    name: 'Phát Triển App iOS',
    provider: 'Mobile First',
    category: 'Mobile App',
    price: '15,000,000 VNĐ',
    status: 'rejected',
    rating: 0,
    reviews: 0,
    submittedAt: '2024-04-03',
    hasViolations: false,
  },
  {
    id: 'SV005',
    name: 'Tư Vấn Chiến Lược Số',
    provider: 'Consulting Group',
    category: 'Tư Vấn',
    price: '12,000,000 VNĐ',
    status: 'pending',
    rating: 0,
    reviews: 0,
    submittedAt: '2024-04-09',
    hasViolations: false,
  },
];

const statusConfig = {
  pending: { label: 'Chờ Duyệt', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Đã Duyệt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Từ Chối', color: 'bg-red-100 text-red-800', icon: XCircle },
  timeout: { label: 'Quá Hạn', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>(mockServices);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredServices =
    filterStatus === 'all' ? services : services.filter((s) => s.status === filterStatus);

  const pendingWithViolationsCount = services.filter(
    (s) => s.status === 'pending' && s.hasViolations
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Quản Lý Dịch Vụ</h3>
          <p className="text-gray-600 mt-1">
            Duyệt và quản lý dịch vụ với AI detection
            {pendingWithViolationsCount > 0 && (
              <span className="text-red-600 font-medium">
                {' '}
                - {pendingWithViolationsCount} dịch vụ cần kiểm tra
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'approved', 'rejected', 'timeout'].map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => setFilterStatus(status)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            {status === 'all'
              ? 'Tất Cả'
              : statusConfig[status as keyof typeof statusConfig]?.label}
          </Button>
        ))}
      </div>

      {/* Services Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
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
                {filteredServices.map((service) => {
                  const statusInfo = statusConfig[service.status];
                  const StatusIcon = statusInfo?.icon;

                  return (
                    <tr
                      key={service.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        service.hasViolations && service.status === 'pending' ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{service.name}</p>
                          <p className="text-xs text-gray-600">{service.id}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{service.provider}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{service.price}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo?.color}`}>
                            {StatusIcon && <StatusIcon className="w-3 h-3" />}
                            {statusInfo?.label}
                          </span>
                          {service.status === 'timeout' && service.timeoutHours && (
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                              {service.timeoutHours}h còn lại
                            </span>
                          )}
                          {service.hasViolations && service.status === 'pending' && (
                            <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Có vi phạm
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {service.rating > 0 ? (
                          <div>
                            <p className="font-medium text-gray-900">{service.rating}/5.0</p>
                            <p className="text-xs text-gray-600">{service.reviews} đánh giá</p>
                          </div>
                        ) : (
                          <p className="text-gray-500">Chưa có đánh giá</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            setSelectedService(service);
                            setShowDetailModal(true);
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && selectedService && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{selectedService.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nhà Cung Cấp</p>
                  <p className="font-medium">{selectedService.provider}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Giá</p>
                  <p className="font-medium">{selectedService.price}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Danh Mục</p>
                  <p className="font-medium">{selectedService.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ngày Gửi</p>
                  <p className="font-medium">{selectedService.submittedAt}</p>
                </div>
              </div>

              {selectedService.hasViolations && selectedService.violations && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Các Vi Phạm Được Phát Hiện
                  </h4>
                  <ul className="space-y-1">
                    {selectedService.violations.map((violation, idx) => (
                      <li key={idx} className="text-sm text-red-800 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                        {violation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailModal(false)}
                >
                  Đóng
                </Button>
                <Button className="bg-green-600 hover:bg-green-700">
                  Duyệt Dịch Vụ
                </Button>
                <Button variant="destructive">
                  Từ Chối
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
