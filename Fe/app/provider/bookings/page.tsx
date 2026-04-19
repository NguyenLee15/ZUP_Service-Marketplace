'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, DollarSign, Clock, MapPin } from 'lucide-react';

interface Booking {
  id: string;
  customerName: string;
  serviceName: string;
  amount: string;
  date: string;
  time: string;
  status: 'pending' | 'quoted' | 'in_progress' | 'completed' | 'cancelled';
  location: string;
}

const bookings: Booking[] = [
  {
    id: 'BK-12348',
    customerName: 'Nguyễn Văn A',
    serviceName: 'Thiết kế logo',
    amount: '500.000 đ',
    date: '2024-06-20',
    time: '14:00',
    status: 'pending',
    location: 'Quận 1, TP.HCM',
  },
  {
    id: 'BK-12347',
    customerName: 'Trần Thị B',
    serviceName: 'Lập trình web',
    amount: '2.000.000 đ',
    date: '2024-06-19',
    time: '10:00',
    status: 'quoted',
    location: 'Quận 2, TP.HCM',
  },
  {
    id: 'BK-12346',
    customerName: 'Lê Văn C',
    serviceName: 'Video editing',
    amount: '800.000 đ',
    date: '2024-06-18',
    time: '15:30',
    status: 'in_progress',
    location: 'Quận 3, TP.HCM',
  },
  {
    id: 'BK-12345',
    customerName: 'Phạm Thị D',
    serviceName: 'Tư vấn marketing',
    amount: '1.200.000 đ',
    date: '2024-06-15',
    time: '09:00',
    status: 'completed',
    location: 'Quận 4, TP.HCM',
  },
  {
    id: 'BK-12344',
    customerName: 'Hoàng Văn E',
    serviceName: 'Thiết kế đồ họa',
    amount: '350.000 đ',
    date: '2024-06-10',
    time: '11:00',
    status: 'cancelled',
    location: 'Quận 5, TP.HCM',
  },
];

export default function ProviderBookings() {
  const [activeTab, setActiveTab] = useState('all');

  const filterBookings = (status?: string) => {
    if (status === 'all') return bookings;
    return bookings.filter(b => b.status === status);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'quoted':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-purple-100 text-purple-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ phản hồi';
      case 'quoted':
        return 'Đã báo giá';
      case 'in_progress':
        return 'Đang thực hiện';
      case 'completed':
        return 'Hoàn thành';
      case 'cancelled':
        return 'Hủy';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quản Lý Booking</h1>
        <p className="text-gray-500 mt-1">Quản lý tất cả các booking từ khách hàng</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="all">Tất Cả ({bookings.length})</TabsTrigger>
          <TabsTrigger value="pending">Chờ ({bookings.filter(b => b.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="quoted">Báo Giá ({bookings.filter(b => b.status === 'quoted').length})</TabsTrigger>
          <TabsTrigger value="in_progress">Đang Làm ({bookings.filter(b => b.status === 'in_progress').length})</TabsTrigger>
          <TabsTrigger value="completed">Hoàn Thành ({bookings.filter(b => b.status === 'completed').length})</TabsTrigger>
          <TabsTrigger value="cancelled">Hủy ({bookings.filter(b => b.status === 'cancelled').length})</TabsTrigger>
        </TabsList>

        {/* Content */}
        <TabsContent value={activeTab} className="space-y-4">
          {filterBookings(activeTab === 'all' ? undefined : activeTab).map((booking) => (
            <Link key={booking.id} href={`/provider/bookings/${booking.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left - Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900">{booking.id}</h3>
                          <p className="text-sm text-gray-600">{booking.customerName}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusBadgeColor(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 mb-2">{booking.serviceName}</p>
                      
                      {/* Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {booking.date}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="w-4 h-4" />
                          {booking.time}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {booking.location}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          {booking.amount}
                        </div>
                      </div>
                    </div>

                    {/* Right - CTA */}
                    <div>
                      <Button variant="outline">
                        Xem Chi Tiết
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}

          {filterBookings(activeTab === 'all' ? undefined : activeTab).length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500 text-lg">Không có booking nào</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
