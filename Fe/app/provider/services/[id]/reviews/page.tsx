'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, ThumbsUp, ThumbsDown, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ratingData = [
  { stars: '5 sao', count: 156 },
  { stars: '4 sao', count: 89 },
  { stars: '3 sao', count: 18 },
  { stars: '2 sao', count: 5 },
  { stars: '1 sao', count: 2 },
];

const reviewStats = [
  { name: 'Tích cực', value: 87, color: '#16A34A' },
  { name: 'Trung bình', value: 10, color: '#EA580C' },
  { name: 'Tiêu cực', value: 3, color: '#DC2626' },
];

const reviews = [
  {
    id: 1,
    customer: 'Nguyễn Văn A',
    rating: 5,
    date: '2024-06-15',
    comment: 'Rất hài lòng với dịch vụ. Designer rất tâm lý, hiểu rõ yêu cầu. Sẽ sử dụng lại!',
    helpful: 45,
  },
  {
    id: 2,
    customer: 'Trần Thị B',
    rating: 5,
    date: '2024-06-14',
    comment: 'Logo đẹp quá. Giao hàng đúng thời gian. Chất lượng cao!',
    helpful: 32,
  },
  {
    id: 3,
    customer: 'Lê Văn C',
    rating: 4,
    date: '2024-06-13',
    comment: 'Tốt, nhưng mất hơi lâu để hoàn thiện chi tiết cuối cùng.',
    helpful: 18,
  },
  {
    id: 4,
    customer: 'Phạm Thị D',
    rating: 5,
    date: '2024-06-12',
    comment: 'Đội ngũ chuyên nghiệp, tận tâm. Rất đáng để làm việc cùng!',
    helpful: 28,
  },
  {
    id: 5,
    customer: 'Hoàng Văn E',
    rating: 3,
    date: '2024-06-11',
    comment: 'Bình thường thôi. Có thể tốt hơn được nhưng vẫn đạt yêu cầu.',
    helpful: 12,
  },
];

export default function ServiceReviewsPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Link href="/provider/services">
        <Button variant="ghost" className="flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Quay Lại
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Đánh Giá Dịch Vụ</h1>
        <p className="text-gray-500 mt-1">ID Dịch Vụ: {params.id}</p>
      </div>

      {/* Rating Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tổng Đánh Giá */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Đánh Giá Trung Bình</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold text-gray-900">4.8</div>
            <div className="flex justify-center gap-1 mt-2">
              {Array(5).fill(0).map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 text-yellow-400 fill-yellow-400"
                />
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">Dựa trên 270 đánh giá</p>
          </CardContent>
        </Card>

        {/* Tổng Booking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tổng Booking</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold text-gray-900">342</div>
            <p className="text-sm text-gray-500 mt-2">+5% so với tháng trước</p>
          </CardContent>
        </Card>

        {/* Tỷ Lệ Phản Hồi */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tỷ Lệ Phản Hồi</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-5xl font-bold text-green-600">98%</div>
            <p className="text-sm text-gray-500 mt-2">Rất nhanh chóng</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Phân Bố Đánh Giá</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ratingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stars" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563EB" name="Số lượng" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Phân Tích Cảm Xúc</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reviewStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name} ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reviewStats.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Đánh Giá</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{review.customer}</p>
                    <p className="text-sm text-gray-500">{review.date}</p>
                  </div>
                  <div className="flex gap-1">
                    {Array(review.rating).fill(0).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                    {Array(5 - review.rating).fill(0).map((_, i) => (
                      <Star
                        key={i + review.rating}
                        className="w-4 h-4 text-gray-300"
                      />
                    ))}
                  </div>
                </div>

                {/* Comment */}
                <p className="text-gray-700 mb-3">{review.comment}</p>

                {/* Footer */}
                <div className="flex gap-4">
                  <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600">
                    <ThumbsUp className="w-4 h-4" />
                    Hữu ích ({review.helpful})
                  </button>
                  <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
                    <ThumbsDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
