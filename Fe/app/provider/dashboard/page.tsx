'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Briefcase, DollarSign, AlertCircle, Download } from 'lucide-react'

// Mock data
const kpiData = [
  { label: 'Số dư ví', value: '2,450,000 ₫', icon: DollarSign, color: 'bg-green-500', trend: '+12.5%' },
  { label: 'Doanh thu hôm nay', value: '1,500,000 ₫', icon: TrendingUp, color: 'bg-blue-500', trend: '+8.3%' },
  { label: 'Tổng đơn (tháng)', value: '24', icon: Briefcase, color: 'bg-purple-500', trend: '+5 đơn' },
  { label: 'Tỷ lệ hủy', value: '2.5%', icon: AlertCircle, color: 'bg-orange-500', trend: '-0.8%' },
]

const revenueData = [
  { date: 'T2', revenue: 2400 },
  { date: 'T3', revenue: 1398 },
  { date: 'T4', revenue: 9800 },
  { date: 'T5', revenue: 3908 },
  { date: 'T6', revenue: 4800 },
  { date: 'T7', revenue: 3800 },
  { date: 'T8', revenue: 4300 },
]

const statusData = [
  { name: 'Chờ XN', value: 5, fill: '#fbbf24' },
  { name: 'Đã XN', value: 8, fill: '#60a5fa' },
  { name: 'Đang làm', value: 7, fill: '#34d399' },
  { name: 'Hoàn thành', value: 12, fill: '#10b981' },
]

export default function ProviderDashboard() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportPDF = async () => {
    setIsExporting(true)
    // Simulate PDF export
    await new Promise((resolve) => setTimeout(resolve, 2000))
    alert('📄 Đã export PDF thành công!')
    setIsExporting(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Nhà Cung Cấp</h1>
            <p className="text-gray-600 mt-1">Chào mừng Trần Văn Provider 👋</p>
          </div>
          <Button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Đang export...' : 'Export PDF'}
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiData.map((kpi, idx) => {
            const Icon = kpi.icon
            return (
              <Card key={idx} className="border-0 shadow-md hover:shadow-lg transition">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-sm font-medium text-gray-600">{kpi.label}</CardTitle>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</p>
                    </div>
                    <div className={`${kpi.color} p-3 rounded-lg text-white`}>
                      <Icon size={20} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500">
                    <span className="text-green-600 font-medium">{kpi.trend}</span> so với tuần trước
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart - Doanh thu */}
          <Card className="lg:col-span-2 border-0 shadow-md">
            <CardHeader>
              <CardTitle>Doanh Thu Hàng Ngày</CardTitle>
              <CardDescription>Thống kê 7 ngày gần nhất</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                    formatter={(value) => `${value.toLocaleString()} ₫`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                    name="Doanh thu"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pie Chart - Trạng thái */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Trạng Thái Đơn</CardTitle>
              <CardDescription>Phân bố 32 đơn</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name} (${value})`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} đơn`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6 border-0 shadow-md bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">⚡</span> Hành Động Nhanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button variant="outline" className="h-12">➕ Thêm Dịch Vụ</Button>
              <Button variant="outline" className="h-12">📊 Xem Đánh Giá</Button>
              <Button variant="outline" className="h-12">💰 Nạp Tiền</Button>
              <Button variant="outline" className="h-12">📋 Xem Đơn Mới</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
