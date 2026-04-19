'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, Users, CheckCircle, Download } from 'lucide-react';

// Mock data for charts
const revenueData = [
  { month: 'Tháng 1', revenue: 1200000, bookings: 24 },
  { month: 'Tháng 2', revenue: 1900000, bookings: 36 },
  { month: 'Tháng 3', revenue: 2200000, bookings: 42 },
  { month: 'Tháng 4', revenue: 2800000, bookings: 54 },
  { month: 'Tháng 5', revenue: 3100000, bookings: 62 },
  { month: 'Tháng 6', revenue: 3500000, bookings: 71 },
];

const serviceDistribution = [
  { name: 'Thiết kế đồ họa', value: 35, color: '#2563EB' },
  { name: 'Lập trình web', value: 25, color: '#16A34A' },
  { name: 'Video editing', value: 20, color: '#EA580C' },
  { name: 'Tư vấn quản lý', value: 20, color: '#8B5CF6' },
];

export default function ProviderDashboard() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    // Simulate PDF export
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsExporting(false);
    alert('Báo cáo đã được tải xuống: doanh_thu_q2_2024.pdf');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Xin chào, Công ty ABC! Đây là thống kê của bạn trong tháng 6</p>
        </div>
        <Button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          {isExporting ? 'Đang tải...' : 'Xuất báo cáo'}
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Doanh Thu Tháng Này</CardTitle>
            <DollarSign className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.500.000 đ</div>
            <p className="text-xs text-green-600 mt-1">+12.5% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Booking Hoàn Thành</CardTitle>
            <CheckCircle className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">71</div>
            <p className="text-xs text-green-600 mt-1">+14.5% so với tháng trước</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Đánh Giá Trung Bình</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-gray-500 mt-1">Dựa trên 245 đánh giá</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Khách Hàng Quay Lại</CardTitle>
            <Users className="w-4 h-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">68%</div>
            <p className="text-xs text-green-600 mt-1">+8.2% so với tháng trước</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart - Doanh Thu & Booking */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Biểu Đồ Doanh Thu & Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value) => {
                    if (typeof value === 'number') {
                      return value > 1000000 ? `${(value / 1000000).toFixed(1)}M đ` : `${(value / 1000).toFixed(0)}K`;
                    }
                    return value;
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563EB"
                  name="Doanh Thu (đ)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="bookings"
                  stroke="#16A34A"
                  name="Booking"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - Phân Bố Dịch Vụ */}
        <Card>
          <CardHeader>
            <CardTitle>Phân Bố Dịch Vụ</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={serviceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceDistribution.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Gần Đây</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { id: '#BK-12345', customer: 'Nguyễn Văn A', service: 'Thiết kế logo', amount: '500.000 đ', status: 'Hoàn thành', date: '15/06/2024' },
              { id: '#BK-12344', customer: 'Trần Thị B', service: 'Lập trình web', amount: '2.000.000 đ', status: 'Đang làm', date: '14/06/2024' },
              { id: '#BK-12343', customer: 'Lê Văn C', service: 'Video editing', amount: '800.000 đ', status: 'Chờ thanh toán', date: '13/06/2024' },
            ].map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{booking.id} - {booking.customer}</p>
                  <p className="text-sm text-gray-500">{booking.service}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{booking.amount}</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                    booking.status === 'Hoàn thành' ? 'bg-green-100 text-green-700' :
                    booking.status === 'Đang làm' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
