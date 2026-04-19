'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Star,
  MapPin,
  Phone,
  MessageSquare,
  Heart,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import Link from 'next/link'

interface Review {
  id: number
  author: string
  rating: number
  date: string
  comment: string
  avatar: string
}

const reviews: Review[] = [
  {
    id: 1,
    author: 'Trần Thị B',
    rating: 5,
    date: '2024-04-01',
    comment: 'Dịch vụ rất tuyệt vời! Nhân viên chuyên nghiệp, nhiệt tình. Sẽ sử dụng lại lần tới.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1',
  },
  {
    id: 2,
    author: 'Lê Văn C',
    rating: 4,
    date: '2024-03-28',
    comment: 'Chất lượng tốt, giá hợp lý. Tuy nhiên thời gian chờ hơi lâu.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2',
  },
  {
    id: 3,
    author: 'Phạm Thị D',
    rating: 5,
    date: '2024-03-25',
    comment: 'Rất hài lòng! Kỹ thuật viên giỏi, tư vấn chi tiết trước khi thực hiện.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3',
  },
]

export default function ServiceDetailPage({ params }: { params: { id: string } }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)

  const images = [
    'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1606232174710-a4ad82e78dd4?w=600&h=400&fit=crop',
  ]

  const service = {
    name: 'Sửa Điện Thoại Chuyên Nghiệp',
    provider: 'Minh Đức Mobile',
    rating: 4.9,
    reviewCount: 324,
    price: 150000,
    distance: 2.5,
    description: `Dịch vụ sửa chữa điện thoại chuyên nghiệp với các kỹ thuật viên có kinh nghiệm hơn 10 năm. 
      
Chúng tôi cung cấp dịch vụ sửa chữa cho tất cả các loại điện thoại di động từ những hãng nổi tiếng như iPhone, Samsung, Oppo, Vivo, Xiaomi, v.v.

Các dịch vụ chính:
- Thay pin
- Thay màn hình
- Sửa cổng sạc
- Sửa loa
- Sửa mic
- Sửa mạch điện
- Làm sạch bo mạch

Tất cả công việc được bảo hành 6 tháng. Chúng tôi sử dụng các linh kiện chính hãng và không liên kết.

Thời gian xử lý nhanh chóng, đa số xong trong ngày.`,
    features: [
      'Kỹ thuật viên chuyên nghiệp, kinh nghiệm 10+',
      'Đảm bảo chất lượng 100%',
      'Bảo hành 6 tháng',
      'Sử dụng linh kiện chính hãng',
      'Xử lý nhanh, đa số trong ngày',
      'Giá cạnh tranh',
    ],
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Back Button */}
        <Link href="/services" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ChevronLeft className="w-5 h-5" />
          Quay Lại
        </Link>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Images & Description */}
          <div className="md:col-span-2 space-y-6">
            {/* Image Slider */}
            <Card className="overflow-hidden border border-gray-200">
              <div className="relative bg-gray-900 aspect-video flex items-center justify-center overflow-hidden">
                <img
                  src={images[currentImageIndex]}
                  alt={`Service image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Navigation Buttons */}
                <button
                  onClick={() =>
                    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full transition z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              </div>

              {/* Thumbnails */}
              <div className="flex gap-2 p-4 bg-white">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-20 h-20 rounded border-2 overflow-hidden flex-shrink-0 transition ${
                      idx === currentImageIndex ? 'border-blue-600' : 'border-gray-300'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </Card>

            {/* Description */}
            <Card className="p-6 border border-gray-200">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">{service.name}</h1>

              {/* Basic Info */}
              <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array(5)
                      .fill(0)
                      .map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < Math.floor(service.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                  </div>
                  <span className="font-semibold text-gray-900">{service.rating}</span>
                  <span className="text-gray-600">({service.reviewCount} đánh giá)</span>
                </div>

                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-5 h-5" />
                  {service.distance} km
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Điểm Nổi Bật</h3>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700">
                      <span className="text-green-600 font-bold text-lg leading-none mt-0.5">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Full Description */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Chi Tiết Dịch Vụ</h3>
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{service.description}</p>
              </div>
            </Card>

            {/* Reviews */}
            <Card className="p-6 border border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Đánh Giá Từ Khách Hàng</h2>

              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="pb-4 border-b border-gray-200 last:border-0">
                    <div className="flex items-start gap-4">
                      <img
                        src={review.avatar}
                        alt={review.author}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900">{review.author}</h4>
                          <span className="text-xs text-gray-500">
                            {new Date(review.date).toLocaleDateString('vi-VN')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          {Array(5)
                            .fill(0)
                            .map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                        </div>

                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column - Sticky Booking Box */}
          <div className="md:col-span-1">
            <Card className="p-6 border border-gray-200 sticky top-24 space-y-4">
              {/* Price */}
              <div className="pb-4 border-b border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Giá Tham Khảo</p>
                <p className="text-4xl font-bold text-blue-600">{service.price.toLocaleString('vi-VN')}₫</p>
              </div>

              {/* Provider Info */}
              <div className="pb-4 border-b border-gray-200">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">Thông Tin Nhà Cung Cấp</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="https://api.dicebear.com/7.x/avataaars/svg?seed=provider123"
                      alt={service.provider}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{service.provider}</p>
                      <div className="flex items-center gap-1">
                        {Array(5)
                          .fill(0)
                          .map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(service.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        <span className="text-xs text-gray-600">{service.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="pb-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Số Lượng</p>
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-2 w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition"
                  >
                    −
                  </button>
                  <span className="font-semibold text-gray-900 w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-gray-200">
                <Link href={`/chat?service=${params.id}`} className="block">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2 text-gray-700"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Chat Với Nhà Cung Cấp
                  </Button>
                </Link>

                <Link href={`/bookings/new?service=${params.id}`} className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-6">
                    Đặt Dịch Vụ
                  </Button>
                </Link>

                <Button variant="outline" className="w-full flex items-center justify-center gap-2 text-gray-700">
                  <Heart className="w-5 h-5" />
                  Yêu Thích
                </Button>
              </div>

              {/* Contact Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-gray-600 uppercase tracking-wide mb-3">Liên Hệ Trực Tiếp</p>
                <div className="space-y-2">
                  <a
                    href="tel:0912345678"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    0912 345 678
                  </a>
                  <a
                    href="https://www.google.com/maps"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <MapPin className="w-4 h-4" />
                    Xem Bản Đồ
                  </a>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
