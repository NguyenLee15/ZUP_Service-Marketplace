'use client';

import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BookingTimeline {
  id: string;
  events: Array<{
    status: string;
    timestamp: string;
    description: string;
    actor?: string;
    details?: string;
  }>;
}

interface Booking {
  id: string;
  customer: string;
  provider: string;
  service: string;
  amount: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  timeline: BookingTimeline;
}

const mockBookings: Booking[] = [
  {
    id: 'BK001',
    customer: 'Nguyễn Văn A',
    provider: 'Tech Solutions',
    service: 'Thiết kế website',
    amount: '5,000,000 VNĐ',
    createdAt: '2024-04-01',
    status: 'completed',
    timeline: {
      id: 'BK001',
      events: [
        {
          status: 'created',
          timestamp: '2024-04-01 09:30',
          description: 'Đơn hàng được tạo',
          actor: 'Khách hàng',
        },
        {
          status: 'confirmed',
          timestamp: '2024-04-01 10:15',
          description: 'Nhà cung cấp xác nhận',
          actor: 'Tech Solutions',
          details: 'Đã yêu cầu báo giá',
        },
        {
          status: 'quoted',
          timestamp: '2024-04-01 14:00',
          description: 'Báo giá được gửi',
          actor: 'Tech Solutions',
          details: '5,000,000 VNĐ - Thời gian: 15 ngày',
        },
        {
          status: 'accepted',
          timestamp: '2024-04-02 08:30',
          description: 'Khách hàng chấp nhận báo giá',
          actor: 'Khách hàng',
          details: 'Thanh toán 30% ứng trước (1,500,000 VNĐ)',
        },
        {
          status: 'in_progress',
          timestamp: '2024-04-02 09:00',
          description: 'Bắt đầu thực hiện dịch vụ',
          actor: 'Tech Solutions',
        },
        {
          status: 'completed',
          timestamp: '2024-04-16 16:30',
          description: 'Dịch vụ hoàn thành',
          actor: 'Tech Solutions',
          details: 'Thanh toán 70% còn lại (3,500,000 VNĐ)',
        },
      ],
    },
  },
  {
    id: 'BK002',
    customer: 'Trần Thị B',
    provider: 'Digital Marketing Pro',
    service: 'SEO tối ưu hóa',
    amount: '3,500,000 VNĐ',
    createdAt: '2024-04-05',
    status: 'in_progress',
    timeline: {
      id: 'BK002',
      events: [
        {
          status: 'created',
          timestamp: '2024-04-05 10:00',
          description: 'Đơn hàng được tạo',
          actor: 'Khách hàng',
        },
        {
          status: 'confirmed',
          timestamp: '2024-04-05 11:30',
          description: 'Nhà cung cấp xác nhận',
          actor: 'Digital Marketing Pro',
          details: 'Bắt đầu phân tích trang web',
        },
        {
          status: 'in_progress',
          timestamp: '2024-04-06 09:00',
          description: 'Bắt đầu thực hiện dịch vụ',
          actor: 'Digital Marketing Pro',
          details: 'Thời gian dự tính: 30 ngày',
        },
      ],
    },
  },
  {
    id: 'BK003',
    customer: 'Phạm Văn C',
    provider: 'Social Connect',
    service: 'Quản lý mạng xã hội',
    amount: '2,000,000 VNĐ',
    createdAt: '2024-04-08',
    status: 'pending',
    timeline: {
      id: 'BK003',
      events: [
        {
          status: 'created',
          timestamp: '2024-04-08 14:20',
          description: 'Đơn hàng được tạo',
          actor: 'Khách hàng',
        },
        {
          status: 'waiting',
          timestamp: '2024-04-08 14:20',
          description: 'Chờ nhà cung cấp xác nhận',
          details: 'Thời hạn chưa: 48 giờ',
        },
      ],
    },
  },
];

const statusConfig = {
  pending: { label: 'Chờ Xác Nhận', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Đã Xác Nhận', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'Đang Thực Hiện', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Hoàn Thành', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'Đã Hủy', color: 'bg-red-100 text-red-800' },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(bookings[0]);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredBookings =
    filterStatus === 'all'
      ? bookings.filter(
          (b) =>
            b.id.includes(searchTerm.toUpperCase()) ||
            b.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.service.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : bookings.filter(
          (b) =>
            b.status === filterStatus &&
            (b.id.includes(searchTerm.toUpperCase()) ||
              b.customer.toLowerCase().includes(searchTerm.toLowerCase()))
        );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Quản Lý Đơn Hàng</h3>
          <p className="text-gray-600 mt-1">Xem timeline chi tiết và trạng thái đơn hàng</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Tìm kiếm theo mã, khách hàng hoặc dịch vụ..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {['all', 'pending', 'confirmed', 'in_progress', 'completed'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              onClick={() => setFilterStatus(status)}
              size="sm"
            >
              {status === 'all'
                ? 'Tất Cả'
                : statusConfig[status as keyof typeof statusConfig]?.label}
            </Button>
          ))}
        </div>
      </div>

      {/* 2-Column Layout: List + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Bookings List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Danh Sách Đơn Hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {filteredBookings.map((booking) => {
                const statusInfo = statusConfig[booking.status];
                const isSelected = selectedBooking?.id === booking.id;

                return (
                  <button
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className={`w-full text-left p-3 rounded-lg transition-colors border-2 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-gray-900 text-sm">{booking.id}</p>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${statusInfo?.color}`}
                      >
                        {statusInfo?.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{booking.customer}</p>
                    <p className="text-xs text-gray-600 truncate">{booking.service}</p>
                    <p className="text-xs font-medium text-gray-900 mt-1">{booking.amount}</p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Column 2 & 3: Timeline View */}
        {selectedBooking && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle className="text-lg">{selectedBooking.id} - Timeline</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{selectedBooking.customer}</p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Header Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Dịch Vụ</p>
                    <p className="font-medium text-gray-900 text-sm">{selectedBooking.service}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Nhà Cung Cấp</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {selectedBooking.provider}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-600">Số Tiền</p>
                    <p className="font-medium text-gray-900 text-sm">{selectedBooking.amount}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600">Trạng Thái</p>
                    <p className="font-medium text-blue-900 text-sm">
                      {statusConfig[selectedBooking.status]?.label}
                    </p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Lịch Sử Sự Kiện</h4>
                  <div className="relative">
                    {selectedBooking.timeline.events.map((event, idx) => {
                      const isLast = idx === selectedBooking.timeline.events.length - 1;
                      const isCompleted =
                        event.status !== 'waiting' &&
                        (event.status === 'completed' ||
                          event.status === 'accepted' ||
                          event.status === 'in_progress');

                      return (
                        <div key={idx} className="flex gap-4">
                          {/* Timeline Dot & Line */}
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                isCompleted ? 'bg-green-600' : 'bg-gray-300'
                              }`}
                            ></div>
                            {!isLast && (
                              <div
                                className={`w-0.5 h-16 ${
                                  isCompleted ? 'bg-green-600' : 'bg-gray-300'
                                }`}
                              ></div>
                            )}
                          </div>

                          {/* Event Content */}
                          <div className="pb-4 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">{event.description}</p>
                              {isCompleted && (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                              <Clock className="w-3 h-3" />
                              <span>{event.timestamp}</span>
                              {event.actor && <span className="text-gray-400">•</span>}
                              {event.actor && <span>{event.actor}</span>}
                            </div>

                            {event.details && (
                              <div className="bg-gray-50 p-2 rounded text-sm text-gray-700">
                                {event.details}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedBooking.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Đơn hàng đang chờ xác nhận từ nhà cung cấp
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Gửi Nhắc Nhở
                      </Button>
                      <Button size="sm" variant="destructive">
                        Hủy Đơn
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
