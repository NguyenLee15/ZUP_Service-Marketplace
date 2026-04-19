'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, Users, Package, DollarSign } from 'lucide-react';

// Mock data
const revenueData = [
  { month: 'Tháng 1', revenue: 4000, commission: 400 },
  { month: 'Tháng 2', revenue: 5200, commission: 520 },
  { month: 'Tháng 3', revenue: 4800, commission: 480 },
  { month: 'Tháng 4', revenue: 6100, commission: 610 },
  { month: 'Tháng 5', revenue: 7200, commission: 720 },
  { month: 'Tháng 6', revenue: 8300, commission: 830 },
];

const userTypeData = [
  { name: 'Khách Hàng', value: 3500 },
  { name: 'Nhà Cung Cấp', value: 1200 },
  { name: 'Chưa Xác Thực', value: 800 },
];

const statusData = [
  { status: 'Hoàn Thành', count: 4200, fill: '#10b981' },
  { status: 'Đang Xử Lý', count: 850, fill: '#3b82f6' },
  { status: 'Chờ Duyệt', count: 320, fill: '#f59e0b' },
  { status: 'Bị Hủy', count: 180, fill: '#ef4444' },
];

const KPI = [
  {
    label: 'Tổng Doanh Thu',
    value: '35.6M',
    currency: 'VNĐ',
    icon: DollarSign,
    trend: '+12.5%',
    trendUp: true,
  },
  {
    label: 'Người Dùng Hoạt Động',
    value: '4,500',
    currency: '',
    icon: Users,
    trend: '+8.2%',
    trendUp: true,
  },
  {
    label: 'Dịch Vụ Đang Cung Cấp',
    value: '2,842',
    currency: '',
    icon: Package,
    trend: '+5.1%',
    trendUp: true,
  },
  {
    label: 'Đơn Hàng Hôm Nay',
    value: '127',
    currency: '',
    icon: TrendingUp,
    trend: '-2.4%',
    trendUp: false,
  },
];

const recentBookings = [
  {
    id: 'BK001',
    customer: 'Nguyễn Văn A',
    service: 'Thiết kế website',
    amount: '5,000,000 VNĐ',
    status: 'Hoàn thành',
    date: '2024-04-10',
  },
  {
    id: 'BK002',
    customer: 'Trần Thị B',
    service: 'SEO tối ưu hóa',
    amount: '3,500,000 VNĐ',
    status: 'Đang xử lý',
    date: '2024-04-09',
  },
  {
    id: 'BK003',
    customer: 'Phạm Văn C',
    service: 'Quản lý mạng xã hội',
    amount: '2,000,000 VNĐ',
    status: 'Chờ duyệt',
    date: '2024-04-08',
  },
];

export default function AdminDashboard() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    // Simulate PDF export
    setTimeout(() => {
      setIsExporting(false);
      alert('PDF được xuất thành công! Tải xuống: dashboard-report.pdf');
    }, 1500);
  };

  return (
    <div className="space-y-8">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-3xl font-bold text-gray-900">Dashboard</h3>
          <p className="text-gray-600 mt-1">Tổng quan quản lý hệ thống ngày {new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        <Button onClick={handleExportPDF} disabled={isExporting} className="gap-2">
          <Download className="w-4 h-4" />
          {isExporting ? 'Đang xuất...' : 'Xuất PDF'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {KPI.map((kpi, idx) => {
          const IconComponent = kpi.icon;
          return (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 font-medium">{kpi.label}</p>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="text-2xl font-bold text-gray-900">{kpi.value}</span>
                      {kpi.currency && <span className="text-sm text-gray-600">{kpi.currency}</span>}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className={`text-sm font-medium ${kpi.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.trend} so với tháng trước
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart - Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Xu Hướng Doanh Thu</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Tổng Doanh Thu"
                />
                <Line
                  type="monotone"
                  dataKey="commission"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Hoa Hồng"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - User Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân Bố Người Dùng</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={userTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart - Order Status */}
      <Card>
        <CardHeader>
          <CardTitle>Thống Kê Trạng Thái Đơn Hàng</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" radius={[8, 8, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Đơn Hàng Gần Đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Mã ĐH</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Khách Hàng</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Dịch Vụ</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Số Tiền</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng Thái</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-blue-600">{booking.id}</td>
                    <td className="py-3 px-4 text-gray-700">{booking.customer}</td>
                    <td className="py-3 px-4 text-gray-700">{booking.service}</td>
                    <td className="py-3 px-4 font-medium text-gray-900">{booking.amount}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'Hoàn thành'
                            ? 'bg-green-100 text-green-800'
                            : booking.status === 'Đang xử lý'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{booking.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
