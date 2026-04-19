'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  MapPin,
  User,
  Phone,
  MessageSquare,
  Check,
  Clock,
  ChevronLeft,
  DollarSign,
  AlertCircle,
  X,
  Image as ImageIcon,
  FileText,
} from 'lucide-react'

interface BookingDetail {
  id: string
  serviceName: string
  provider: string
  providerAvatar: string
  providerPhone: string
  status: 'pending' | 'quoted' | 'in_progress' | 'completed'
  date: string
  location: string
  notes: string
  price: number
  image: string
  timeline: Array<{
    step: number
    title: string
    status: 'done' | 'current' | 'pending'
    date?: string
  }>
}

const bookingData: Record<string, BookingDetail> = {
  '1': {
    id: '1',
    serviceName: 'Sửa Điện Thoại',
    provider: 'Minh Đức Mobile',
    providerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider1',
    providerPhone: '0912345678',
    status: 'pending',
    date: '2024-04-15',
    location: 'Hà Nội',
    notes: 'Thay pin iPhone 13',
    price: 150000,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop',
    timeline: [
      { step: 1, title: 'Yêu Cầu Gửi', status: 'done', date: '2024-04-15 10:00' },
      { step: 2, title: 'Nhà Cung Cấp Nhận', status: 'current', date: '2024-04-15 10:30' },
      { step: 3, title: 'Báo Giá', status: 'pending' },
      { step: 4, title: 'Thực Hiện', status: 'pending' },
      { step: 5, title: 'Hoàn Thành', status: 'pending' },
    ],
  },
  '2': {
    id: '2',
    serviceName: 'Dọn Nhà Sâu',
    provider: 'Clean House Pro',
    providerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider2',
    providerPhone: '0987654321',
    status: 'quoted',
    date: '2024-04-12',
    location: 'Hà Nội',
    notes: 'Dọn một căn hộ 2 phòng ngủ',
    price: 500000,
    image: 'https://images.unsplash.com/photo-1581578731548-c64695c952952?w=600&h=400&fit=crop',
    timeline: [
      { step: 1, title: 'Yêu Cầu Gửi', status: 'done', date: '2024-04-12 09:00' },
      { step: 2, title: 'Nhà Cung Cấp Nhận', status: 'done', date: '2024-04-12 09:15' },
      { step: 3, title: 'Báo Giá', status: 'done', date: '2024-04-12 11:00' },
      { step: 4, title: 'Thực Hiện', status: 'pending' },
      { step: 5, title: 'Hoàn Thành', status: 'pending' },
    ],
  },
}

const statusConfig = {
  pending: { label: 'Chờ Xác Nhận', color: 'bg-yellow-100 text-yellow-800' },
  quoted: { label: 'Đã Báo Giá', color: 'bg-blue-100 text-blue-800' },
  in_progress: { label: 'Đang Thực Hiện', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Hoàn Thành', color: 'bg-green-100 text-green-800' },
}

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const booking = bookingData[params.id]
  const [showModal, setShowModal] = useState(false)
  const [counterTime] = useState(24 * 60 * 60) // 24 hours in seconds

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Link href="/bookings" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
            <ChevronLeft className="w-5 h-5" />
            Quay Lại
          </Link>
          <Card className="p-12 text-center border border-gray-200">
            <p className="text-gray-600">Không tìm thấy booking</p>
          </Card>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[booking.status]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
        {/* Back Button */}
        <Link href="/bookings" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <ChevronLeft className="w-5 h-5" />
          Quay Lại
        </Link>

        {/* Header */}
        <Card className="p-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{booking.serviceName}</h1>
              <p className="text-gray-600 mt-1">{booking.provider}</p>
            </div>
            <span className={`px-4 py-2 rounded-full font-semibold text-sm w-fit ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
        </Card>

        {/* Timeline */}
        <Card className="p-6 border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Tiến Độ Đơn Hàng</h2>
          <div className="flex overflow-x-auto gap-2 pb-2">
            {booking.timeline.map((item, idx) => (
              <div key={idx} className="flex-shrink-0 flex flex-col items-center gap-2">
                {/* Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                    item.status === 'done'
                      ? 'bg-green-600 text-white'
                      : item.status === 'current'
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {item.status === 'done' ? <Check className="w-5 h-5" /> : item.step}
                </div>

                {/* Label */}
                <p className="text-xs font-medium text-center text-gray-900 max-w-16">{item.title}</p>
                {item.date && <p className="text-xs text-gray-500">{item.date.split(' ')[1]}</p>}

                {/* Line */}
                {idx < booking.timeline.length - 1 && (
                  <div className="hidden md:block w-0.5 h-8 bg-gray-200 mt-2"></div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Details & Provider Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Service Image */}
            <Card className="overflow-hidden border border-gray-200">
              <img src={booking.image} alt={booking.serviceName} className="w-full h-64 object-cover" />
            </Card>

            {/* Service Details */}
            <Card className="p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Chi Tiết Đơn Hàng</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <span className="text-gray-600">Ngày Đặt:</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(booking.date).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <span className="text-gray-600 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Vị Trí:
                  </span>
                  <span className="font-semibold text-gray-900">{booking.location}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-gray-600">Ghi Chú:</span>
                  <span className="font-semibold text-gray-900 text-right max-w-xs">{booking.notes}</span>
                </div>
              </div>
            </Card>

            {/* Provider Card */}
            <Card className="p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Thông Tin Nhà Cung Cấp</h2>
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={booking.providerAvatar}
                  alt={booking.provider}
                  className="w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{booking.provider}</h3>
                  <div className="flex gap-1 text-yellow-400">
                    {Array(5).fill(0).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <a
                  href={`tel:${booking.providerPhone}`}
                  className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                >
                  <Phone className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">{booking.providerPhone}</span>
                </a>
                <Link href={`/chat?provider=${booking.provider}`}>
                  <button className="w-full flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Chat Với Nhà Cung Cấp</span>
                  </button>
                </Link>
              </div>
            </Card>

            {/* Status-Specific Content */}
            {booking.status === 'pending' && (
              <Card className="p-6 border border-gray-200 bg-yellow-50 border-yellow-200">
                <div className="flex gap-4">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2">Chờ Nhà Cung Cấp Xác Nhận</h3>
                    <p className="text-sm text-yellow-800 mb-4">
                      Nhà cung cấp sẽ liên hệ với bạn trong vòng 1-2 giờ để xác nhận lịch và báo giá.
                    </p>
                    <Button
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                      onClick={() => setShowModal(true)}
                    >
                      <X className="w-4 h-4" />
                      Hủy Yêu Cầu
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {booking.status === 'quoted' && (
              <Card className="p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Thông Tin Báo Giá</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Giá Dự Kiến</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {booking.price.toLocaleString('vi-VN')}₫
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-blue-700 mb-4">Thời Gian Thực Hiện: 1-2 ngày</p>
                  <p className="text-sm text-gray-600 mb-4">
                    Ghi Chú: Giá trên đã bao gồm vật liệu và nhân công. Không có chi phí phát sinh.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 text-base">
                    Đồng Ý Báo Giá
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => setShowModal(true)}
                  >
                    Từ Chối
                  </Button>
                </div>
              </Card>
            )}

            {booking.status === 'completed' && (
              <Card className="p-6 border border-gray-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Hình Ảnh Kết Quả</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {Array(3).fill(0).map((_, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg bg-gray-200 flex items-center justify-center hover:bg-gray-300 transition cursor-pointer"
                    >
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                  ))}
                </div>
                <Link href={`/bookings/${booking.id}/review`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    Đánh Giá Dịch Vụ
                  </Button>
                </Link>
              </Card>
            )}
          </div>

          {/* Right Column - Price Summary */}
          <div>
            <Card className="p-6 border border-gray-200 sticky top-24 space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Tóm Tắt Giá</h2>

              <div className="space-y-3 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Giá Dịch Vụ:</span>
                  <span className="font-semibold text-gray-900">{booking.price.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Phí Nền Tảng:</span>
                  <span className="font-semibold text-gray-900">0₫</span>
                </div>
              </div>

              <div className="flex justify-between text-lg">
                <span className="font-bold text-gray-900">Tổng Cộng:</span>
                <span className="font-bold text-blue-600">{booking.price.toLocaleString('vi-VN')}₫</span>
              </div>

              {booking.status === 'completed' && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-green-600 font-semibold mb-2 flex items-center gap-1">
                    <Check className="w-4 h-4" /> Đã Thanh Toán
                  </p>
                </div>
              )}

              {booking.status === 'completed' && (
                <div className="pt-4 border-t border-gray-200 text-center">
                  <Link href={`/bookings/${booking.id}/dispute`}>
                    <Button variant="outline" className="w-full text-red-600 border-red-300 hover:bg-red-50">
                      Khiếu Nại
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Hủy Yêu Cầu</h2>
              <p className="text-gray-600 mb-6">Bạn có chắc chắn muốn hủy yêu cầu này không?</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowModal(false)}
                  className="flex-1 text-gray-700"
                >
                  Không
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white">
                  Hủy
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
