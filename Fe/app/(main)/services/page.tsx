'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, MapPin, Star, ChevronDown, Filter } from 'lucide-react'

interface Service {
  id: number
  name: string
  provider: string
  rating: number
  reviews: number
  price: number
  distance: number
  image: string
  category: string
}

const allServices: Service[] = [
  {
    id: 1,
    name: 'Sửa Điện Thoại Nhanh Chóng',
    provider: 'Minh Đức Mobile',
    rating: 4.9,
    reviews: 324,
    price: 150000,
    distance: 2.5,
    image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=300&h=200&fit=crop',
    category: 'Công Nghệ',
  },
  {
    id: 2,
    name: 'Dọn Nhà Sâu Chuyên Nghiệp',
    provider: 'Clean House Pro',
    rating: 4.8,
    reviews: 512,
    price: 500000,
    distance: 1.2,
    image: 'https://images.unsplash.com/photo-1581578731548-c64695c952952?w=300&h=200&fit=crop',
    category: 'Vệ Sinh',
  },
  {
    id: 3,
    name: 'Cắt Tóc & Tạo Kiểu',
    provider: 'Hair Salon Việt',
    rating: 4.7,
    reviews: 789,
    price: 350000,
    distance: 0.8,
    image: 'https://images.unsplash.com/photo-1562122176-ffe26f17e826?w=300&h=200&fit=crop',
    category: 'Làm Đẹp',
  },
  {
    id: 4,
    name: 'Thiết Kế Logo & Branding',
    provider: 'Creative Studio',
    rating: 4.95,
    reviews: 203,
    price: 2500000,
    distance: 5.3,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=200&fit=crop',
    category: 'Thiết Kế',
  },
  {
    id: 5,
    name: 'Sửa Chữa Máy Giặt',
    provider: 'Việt Sửa Chữa',
    rating: 4.6,
    reviews: 156,
    price: 250000,
    distance: 3.1,
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&h=200&fit=crop',
    category: 'Sửa Chữa',
  },
  {
    id: 6,
    name: 'Tư Vấn Kinh Doanh Online',
    provider: 'Success Consultant',
    rating: 4.85,
    reviews: 421,
    price: 800000,
    distance: 4.2,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop',
    category: 'Tư Vấn',
  },
  {
    id: 7,
    name: 'Dạy Tiếng Anh Online',
    provider: 'English Academy',
    rating: 4.8,
    reviews: 654,
    price: 300000,
    distance: 0,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=300&h=200&fit=crop',
    category: 'Giáo Dục',
  },
  {
    id: 8,
    name: 'Sơn Nhà Chuyên Nghiệp',
    provider: 'Paint & More',
    rating: 4.7,
    reviews: 289,
    price: 1200000,
    distance: 2.8,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop',
    category: 'Sửa Chữa',
  },
]

type SortOption = 'popular' | 'price-low' | 'price-high' | 'rating' | 'newest'

export default function ServicesPage() {
  const [sortBy, setSortBy] = useState<SortOption>('popular')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000000])
  const [minRating, setMinRating] = useState(0)
  const [maxDistance, setMaxDistance] = useState(10)
  const [showFilters, setShowFilters] = useState(false)

  const filteredAndSorted = useMemo(() => {
    let result = [...allServices]

    // Apply filters
    result = result.filter(s => {
      const inPriceRange = s.price >= priceRange[0] && s.price <= priceRange[1]
      const ratingOk = s.rating >= minRating
      const distanceOk = s.distance <= maxDistance
      return inPriceRange && ratingOk && distanceOk
    })

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price-high':
        result.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        result.sort((a, b) => b.rating - a.rating)
        break
      case 'newest':
        result.reverse()
        break
      default: // popular
        result.sort((a, b) => b.reviews - a.reviews)
    }

    return result
  }, [sortBy, priceRange, minRating, maxDistance])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-20 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm dịch vụ..."
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6 grid md:grid-cols-4 gap-6">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden md:block">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-32 space-y-6">
            <h3 className="font-bold text-gray-900 text-lg">Bộ Lọc</h3>

            {/* Price Range */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900">Khoảng Giá</label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="3000000"
                  step="50000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">
                  Đến {priceRange[1].toLocaleString('vi-VN')}₫
                </p>
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-3 border-t pt-4">
              <label className="text-sm font-semibold text-gray-900">Đánh Giá Tối Thiểu</label>
              <div className="space-y-2">
                {[0, 3, 3.5, 4, 4.5].map(rating => (
                  <label key={rating} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">
                      {rating === 0 ? 'Tất cả' : `${rating}+ sao`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Distance */}
            <div className="space-y-3 border-t pt-4">
              <label className="text-sm font-semibold text-gray-900">Khoảng Cách</label>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">Đến {maxDistance.toFixed(1)} km</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full text-gray-700"
              onClick={() => {
                setPriceRange([0, 3000000])
                setMinRating(0)
                setMaxDistance(10)
              }}
            >
              Xóa Bộ Lọc
            </Button>
          </div>
        </aside>

        {/* Mobile Filters Modal */}
        {showFilters && (
          <div className="fixed inset-0 z-50 md:hidden bg-black bg-opacity-50 flex flex-col">
            <div className="bg-white flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-900 text-lg">Bộ Lọc</h3>
                <button onClick={() => setShowFilters(false)} className="text-gray-500">✕</button>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-gray-900">Khoảng Giá</label>
                <input
                  type="range"
                  min="0"
                  max="3000000"
                  step="50000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">
                  Đến {priceRange[1].toLocaleString('vi-VN')}₫
                </p>
              </div>

              {/* Rating */}
              <div className="space-y-3 border-t pt-4">
                <label className="text-sm font-semibold text-gray-900">Đánh Giá Tối Thiểu</label>
                {[0, 3, 3.5, 4, 4.5].map(rating => (
                  <label key={rating} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700">
                      {rating === 0 ? 'Tất cả' : `${rating}+ sao`}
                    </span>
                  </label>
                ))}
              </div>

              {/* Distance */}
              <div className="space-y-3 border-t pt-4">
                <label className="text-sm font-semibold text-gray-900">Khoảng Cách</label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(parseFloat(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">Đến {maxDistance.toFixed(1)} km</p>
              </div>

              <Button onClick={() => setShowFilters(false)} className="w-full bg-blue-600 text-white">
                Áp Dụng
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="md:col-span-3 space-y-4">
          {/* Sort Dropdown */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
            <span className="text-gray-700 font-medium">
              {filteredAndSorted.length} dịch vụ tìm thấy
            </span>
            <div className="relative group">
              <Button variant="outline" className="flex items-center gap-2">
                {sortBy === 'popular' && 'Phổ Biến'}
                {sortBy === 'price-low' && 'Giá: Thấp → Cao'}
                {sortBy === 'price-high' && 'Giá: Cao → Thấp'}
                {sortBy === 'rating' && 'Đánh Giá'}
                {sortBy === 'newest' && 'Mới Nhất'}
                <ChevronDown className="w-4 h-4" />
              </Button>
              <div className="hidden group-hover:block absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-48 z-10">
                {(
                  [
                    { value: 'popular', label: 'Phổ Biến' },
                    { value: 'price-low', label: 'Giá: Thấp → Cao' },
                    { value: 'price-high', label: 'Giá: Cao → Thấp' },
                    { value: 'rating', label: 'Đánh Giá Cao' },
                    { value: 'newest', label: 'Mới Nhất' },
                  ] as const
                ).map(option => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid gap-4">
            {filteredAndSorted.length === 0 ? (
              <Card className="p-12 text-center border border-gray-200">
                <p className="text-gray-600">Không tìm thấy dịch vụ nào phù hợp</p>
              </Card>
            ) : (
              filteredAndSorted.map(service => (
                <Link key={service.id} href={`/services/${service.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition border border-gray-200 flex flex-col md:flex-row cursor-pointer">
                    {/* Image */}
                    <div className="md:w-48 h-40 md:h-auto bg-gray-200 flex-shrink-0">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover hover:scale-105 transition duration-300"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 md:p-6 flex flex-col justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg mb-2">{service.name}</h3>
                        <p className="text-gray-600 text-sm mb-3">{service.provider}</p>

                        {/* Rating & Distance */}
                        <div className="flex items-center gap-4 text-sm mb-3">
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {Array(5).fill(0).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < Math.floor(service.rating)
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="font-semibold text-gray-900">{service.rating}</span>
                            <span className="text-gray-500">({service.reviews})</span>
                          </div>
                          {service.distance > 0 && (
                            <div className="flex items-center gap-1 text-gray-600">
                              <MapPin className="w-4 h-4" />
                              {service.distance} km
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-lg font-bold text-blue-600">
                        {service.price.toLocaleString('vi-VN')}₫
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
