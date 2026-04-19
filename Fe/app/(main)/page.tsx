'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Search,
  MapPin,
  Zap,
  Wrench,
  Home,
  Heart,
  Briefcase,
  Palette,
  Smartphone,
  Utensils,
  BookOpen,
  Music,
  ChevronRight,
  Star,
} from 'lucide-react'

const categories = [
  { icon: Wrench, label: 'Sửa Chữa', count: 1200 },
  { icon: Home, label: 'Vệ Sinh Nhà', count: 850 },
  { icon: Heart, label: 'Làm Đẹp', count: 2300 },
  { icon: Briefcase, label: 'Tư Vấn', count: 450 },
  { icon: Palette, label: 'Thiết Kế', count: 680 },
  { icon: Smartphone, label: 'Công Nghệ', count: 1100 },
  { icon: Utensils, label: 'Nấu Ăn', count: 920 },
  { icon: BookOpen, label: 'Giáo Dục', count: 1450 },
]

const featuredServices = [
  {
    id: 1,
    name: 'Sửa Điện Thoại Chuyên Nghiệp',
    provider: 'Minh Đức Mobile',
    rating: 4.9,
    reviews: 324,
    price: 150000,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=200&fit=crop',
    badge: 'Phổ Biến',
  },
  {
    id: 2,
    name: 'Dọn Nhà Sâu - Chuyên Nghiệp',
    provider: 'Clean House Pro',
    rating: 4.8,
    reviews: 512,
    price: 500000,
    image: 'https://images.unsplash.com/photo-1581578731548-c64695c952952?w=300&h=200&fit=crop',
    badge: 'Được Yêu Thích',
  },
  {
    id: 3,
    name: 'Làm Tóc & Tạo Kiểu',
    provider: 'Hair Salon Việt',
    rating: 4.7,
    reviews: 789,
    price: 350000,
    image: 'https://images.unsplash.com/photo-1562122176-ffe26f17e826?w=300&h=200&fit=crop',
    badge: '',
  },
  {
    id: 4,
    name: 'Thiết Kế Logo & Branding',
    provider: 'Creative Studio',
    rating: 4.95,
    reviews: 203,
    price: 2500000,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=200&fit=crop',
    badge: 'Xuất Sắc',
  },
]

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [location, setLocation] = useState('Hà Nội')
  const [scrollPos, setScrollPos] = useState(0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8 md:py-12">
        <div className="px-4 md:px-6 max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Khám Phá Dịch Vụ Chất Lượng</h1>

          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-lg p-4 space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="md:col-span-2 flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                <Search className="w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Tìm dịch vụ, kỹ năng, bạn cần..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Location Input */}
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                <MapPin className="w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Vị trí..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                <Search className="w-4 h-4" />
                Tìm Kiếm
              </Button>
              <Button variant="outline" className="flex items-center gap-2 text-gray-700">
                <Zap className="w-4 h-4" />
                Tìm Bằng AI
              </Button>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                Dùng GPS
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 py-12 max-w-6xl mx-auto space-y-12">
        {/* Categories Grid */}
        <section>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Danh Mục Nổi Bật</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, idx) => {
              const Icon = cat.icon
              return (
                <Link key={idx} href={`/services?category=${cat.label}`}>
                  <Card className="p-6 text-center hover:shadow-lg hover:border-blue-200 transition cursor-pointer border border-gray-200 h-full">
                    <Icon className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-1">{cat.label}</h3>
                    <p className="text-xs text-gray-500">{cat.count} dịch vụ</p>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Featured Services Slider */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Dịch Vụ Được Đánh Giá Cao</h2>
            <Link href="/services" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
              Xem Tất Cả
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredServices.map(service => (
              <Link key={service.id} href={`/services/${service.id}`}>
                <Card className="overflow-hidden hover:shadow-xl transition border border-gray-200 h-full flex flex-col">
                  {/* Image */}
                  <div className="relative h-40 bg-gray-200 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.name}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                    {service.badge && (
                      <span className="absolute top-3 right-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {service.badge}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-1">{service.name}</h3>
                    <p className="text-xs text-gray-600 mb-3">{service.provider}</p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      <div className="flex">
                        {Array(5).fill(0).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(service.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-gray-900">{service.rating}</span>
                      <span className="text-xs text-gray-500">({service.reviews})</span>
                    </div>

                    {/* Price */}
                    <p className="text-lg font-bold text-blue-600 mt-auto">
                      {service.price.toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-blue-600 text-white rounded-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-3">Bạn Có Kỹ Năng Để Chia Sẻ?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Trở thành Nhà Cung Cấp trên ServiceHub và kiếm tiền từ kỹ năng của bạn
          </p>
          <Button className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8">
            Đăng Ký Nhà Cung Cấp
          </Button>
        </section>
      </div>
    </div>
  )
}
