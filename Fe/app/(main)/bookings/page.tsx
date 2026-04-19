'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, User, Star, ChevronRight, Package } from 'lucide-react'

interface Booking {
  id: string
  serviceName: string
  provider: string
  providerAvatar: string
  status: 'pending' | 'quoted' | 'in_progress' | 'completed' | 'cancelled'
  date: string
  location: string
  price: number
  rating?: number
  image: string
}

const bookings: Booking[] = [
  {
    id: '1',
    serviceName: 'Sửa Điện Thoại',
    provider: 'Minh Đức Mobile',
    providerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider1',
    status: 'pending',
    date: '2024-04-15',
    location: 'Hà Nội',
    price: 150000,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=200&fit=crop',
  },
  {
    id: '2',
    serviceName: 'Dọn Nhà Sâu',
    provider: 'Clean House Pro',
    providerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider2',
    status: 'quoted',
    date: '2024-04-12',
    location: 'Hà Nội',
    price: 500000,
    image: 'https://images.unsplash.com/photo-1581578731548-c64695c952952?w=300&h=200&fit=crop',
  },
  {
    id: '3',
    serviceName: 'Cắt Tóc & Tạo Kiểu',
    provider: 'Hair Salon Việt',
    providerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider3',
    status: 'in_progress',
    date: '2024-04-10',
    location: 'Hà Nội',
    price: 350000,
    image: 'https://images.unsplash.com/photo-1562122176-ffe26f17e826?w=300&h=200&fit=crop',
  },
  {
    id: '4',
    serviceName: 'Thiết Kế Logo',
    provider: 'Creative Studio',
    providerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider4',
    status: 'completed',
    date: '2024-04-05',
    location: 'Online',
    price: 2500000,
    rating: 5,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=200&fit=crop',
  },
  {
    id: '5',
    serviceName: 'Sửa Chữa Máy Giặt',
    provider: 'Việt Sửa Chữa',
    providerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider5',
    status: 'pending',
    date: '2024-04-16',
    location: 'Hà Nội',
    price: 250000,
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&h=200&fit=crop',
  },
]

type StatusFilter = 'all' | 'pending' | 'quoted' | 'in_progress' | 'completed'

const statusConfig = {
  pending: { label: 'Chờ Xác Nhận', color: 'bg-yellow-100 text-yellow-800', badge: 'Chờ XN' },
  quoted: { label: 'Đã Báo Giá', color: 'bg-blue-100 text-blue-800', badge: 'Đã Báo Giá' },
  in_progress: { label: 'Đang Thực Hiện', color: 'bg-purple-100 text-purple-800', badge: 'Đang TH' },
  completed: { label: 'Hoàn Thành', color: 'bg-green-100 text-green-800', badge: 'Xong' },
  cancelled: { label: 'Đã Hủy', color: 'bg-red-100 text-red-800', badge: 'Hủy' },
}

export default function BookingsPage() {
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all')

  const filteredBookings = activeStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === activeStatus)

  const counts = {
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    quoted: bookings.filter(b => b.status === 'quoted').length,
    in_progress: bookings.filter(b => b.status === 'in_progress').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Booking</h1>
            <p className="text-gray-600 mt-1">Theo dõi các đơn dịch vụ của bạn</p>
          </div>
          <Link href="/services">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              + Đặt Dịch Vụ Mới
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2 bg-white rounded-lg border border-gray-200 p-2">
          {(
            [
              { id: 'all' as StatusFilter, label: 'Tất Cả', count: counts.all },
              { id: 'pending' as StatusFilter, label: 'Chờ XN', count: counts.pending },
              { id: 'quoted' as StatusFilter, label: 'Đã Báo Giá', count: counts.quoted },
              { id: 'in_progress' as StatusFilter, label: 'Đang TH', count: counts.in_progress },
              { id: 'completed' as StatusFilter, label: 'Hoàn Thành', count: counts.completed },
            ]
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveStatus(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                activeStatus === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                activeStatus === tab.id ? 'bg-blue-500 bg-opacity-30' : 'bg-gray-300 bg-opacity-50'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <Card className="p-12 text-center border border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Không có booking nào</p>
              <Link href="/services">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white mt-4">
                  Khám Phá Dịch Vụ
                </Button>
              </Link>
            </Card>
          ) : (
            filteredBookings.map(booking => {
              const statusInfo = statusConfig[booking.status]
              return (
                <Link key={booking.id} href={`/bookings/${booking.id}`}>
                  <Card className="p-4 md:p-6 border border-gray-200 hover:shadow-lg transition cursor-pointer flex flex-col md:flex-row gap-4 md:items-center">
                    {/* Image */}
                    <div className="md:w-24 h-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={booking.image}
                        alt={booking.serviceName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:items-start gap-3 mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{booking.serviceName}</h3>
                          <p className="text-sm text-gray-600">{booking.provider}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${statusInfo.color}`}>
                          {statusInfo.badge}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          {new Date(booking.date).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          {booking.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <img
                            src={booking.providerAvatar}
                            alt={booking.provider}
                            className="w-5 h-5 rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Price & Rating */}
                    <div className="flex flex-col items-end gap-3 md:ml-auto">
                      <div className="text-xl font-bold text-blue-600">
                        {booking.price.toLocaleString('vi-VN')}₫
                      </div>
                      {booking.rating && (
                        <div className="flex items-center gap-1">
                          {Array(booking.rating).fill(0).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      )}
                      {booking.status === 'completed' && !booking.rating && (
                        <Button variant="outline" size="sm" className="text-xs">
                          Đánh Giá
                        </Button>
                      )}
                    </div>

                    {/* Action Icon */}
                    <ChevronRight className="hidden md:block w-5 h-5 text-gray-400 flex-shrink-0" />
                  </Card>
                </Link>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
