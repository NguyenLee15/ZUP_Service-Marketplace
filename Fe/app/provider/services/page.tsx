'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Eye, EyeOff, Trash2, Star, MapPin } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category: string;
  price: string;
  description: string;
  rating: number;
  reviews: number;
  bookings: number;
  isActive: boolean;
  image: string;
}

const mockServices: Service[] = [
  {
    id: '1',
    name: 'Thiết Kế Logo Chuyên Nghiệp',
    category: 'Thiết Kế Đồ Họa',
    price: '500.000 đ',
    description: 'Thiết kế logo độc đáo, sáng tạo theo yêu cầu',
    rating: 4.8,
    reviews: 156,
    bookings: 342,
    isActive: true,
    image: '🎨'
  },
  {
    id: '2',
    name: 'Lập Trình Website Responsive',
    category: 'Lập Trình',
    price: '2.000.000 đ',
    description: 'Website tối ưu SEO, tương thích mọi thiết bị',
    rating: 4.9,
    reviews: 98,
    bookings: 156,
    isActive: true,
    image: '💻'
  },
  {
    id: '3',
    name: 'Quay Phim & Chỉnh Sửa Video',
    category: 'Video Editing',
    price: '1.500.000 đ',
    description: 'Quay phim chuyên nghiệp, chỉnh sửa 4K',
    rating: 4.7,
    reviews: 72,
    bookings: 98,
    isActive: false,
    image: '🎬'
  },
  {
    id: '4',
    name: 'Tư Vấn Chiến Lược Marketing',
    category: 'Tư Vấn',
    price: '800.000 đ',
    description: 'Lập kế hoạch marketing tổng thể cho doanh nghiệp',
    rating: 4.6,
    reviews: 45,
    bookings: 67,
    isActive: true,
    image: '📊'
  },
];

export default function ProviderServices() {
  const [services, setServices] = useState(mockServices);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleVisibility = (id: string) => {
    setServices(services.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const deleteService = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa dịch vụ này?')) {
      setServices(services.filter(s => s.id !== id));
    }
  };

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản Lý Dịch Vụ</h1>
          <p className="text-gray-500 mt-1">Bạn có {services.length} dịch vụ đang hoạt động</p>
        </div>
        <Link href="/provider/services/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Thêm Dịch Vụ Mới
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Input
        placeholder="Tìm kiếm dịch vụ..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-3xl">{service.image}</div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{service.name}</CardTitle>
                    <p className="text-sm text-gray-500">{service.category}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleVisibility(service.id)}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                    title={service.isActive ? 'Ẩn dịch vụ' : 'Hiển thị dịch vụ'}
                  >
                    {service.isActive ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  <button
                    onClick={() => deleteService(service.id)}
                    className="p-1.5 hover:bg-red-50 rounded text-red-600"
                    title="Xóa dịch vụ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
              
              {/* Price */}
              <div className="bg-blue-50 p-2 rounded text-center">
                <p className="font-bold text-blue-600 text-lg">{service.price}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium text-gray-900">{service.rating}</span>
                  <span className="text-sm text-gray-500">({service.reviews})</span>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {service.bookings} booking
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  service.isActive 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {service.isActive ? 'Hoạt động' : 'Ẩn'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Link href={`/provider/services/${service.id}`} className="flex-1">
                  <Button variant="outline" className="w-full text-sm">Chỉnh Sửa</Button>
                </Link>
                <Link href={`/provider/services/${service.id}/reviews`} className="flex-1">
                  <Button variant="outline" className="w-full text-sm">Đánh Giá</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredServices.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 text-lg">Không tìm thấy dịch vụ nào</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
