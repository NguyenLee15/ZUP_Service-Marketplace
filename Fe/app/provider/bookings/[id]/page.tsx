'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, FileText, MessageSquare, CheckCircle, Clock, AlertCircle } from 'lucide-react';

type BookingStatus = 'pending' | 'quoted' | 'in_progress' | 'completed';

export default function BookingDetailPage({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState<BookingStatus>('pending');
  const [quoteAmount, setQuoteAmount] = useState('1500000');
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completionNote, setCompletionNote] = useState('');

  const handleSubmitQuote = async () => {
    setIsSubmittingQuote(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmittingQuote(false);
    setStatus('quoted');
    alert(`Báo giá ${quoteAmount} đ đã được gửi cho khách hàng`);
  };

  const handleCompleteBooking = async () => {
    setIsSubmittingQuote(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmittingQuote(false);
    setShowCompleteModal(false);
    setStatus('completed');
    alert('Booking đã được đánh dấu là hoàn thành!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Link href="/provider/bookings">
        <Button variant="ghost" className="flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Quay Lại
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Booking {params.id}</h1>
        <p className="text-gray-500 mt-1">Chi tiết và quản lý booking</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Khách Hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Khách Hàng</p>
                <p className="font-medium text-gray-900">Nguyễn Văn A</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Số Điện Thoại</p>
                <p className="font-medium text-gray-900">0901234567</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">nguyenvana@email.com</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Địa Chỉ</p>
                <p className="font-medium text-gray-900">123 Đường ABC, Quận 1, TP.HCM</p>
              </div>
            </CardContent>
          </Card>

          {/* Service Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông Tin Dịch Vụ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Dịch Vụ</p>
                <p className="font-medium text-gray-900">Thiết kế logo chuyên nghiệp</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày Yêu Cầu</p>
                <p className="font-medium text-gray-900">20/06/2024 - 14:00</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Yêu Cầu</p>
                <p className="text-gray-700">Logo cho công ty công nghệ, phong cách hiện đại, màu xanh dương chủ đạo</p>
              </div>
            </CardContent>
          </Card>

          {/* Status-based Content */}
          {status === 'pending' && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <Clock className="w-5 h-5" />
                  Chờ Phản Hồi
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">Khách hàng đang chờ bạn gửi báo giá. Vui lòng xem xét và gửi giá dịch vụ.</p>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Giá Báo Giá (VNĐ)</label>
                  <Input
                    type="number"
                    value={quoteAmount}
                    onChange={(e) => setQuoteAmount(e.target.value)}
                    placeholder="1500000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Ghi Chú (Tuỳ Chọn)</label>
                  <textarea
                    placeholder="Mô tả về dịch vụ, thời gian hoàn thành, etc..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Button
                  onClick={handleSubmitQuote}
                  disabled={isSubmittingQuote}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmittingQuote ? 'Đang gửi...' : 'Gửi Báo Giá'}
                </Button>
              </CardContent>
            </Card>
          )}

          {status === 'quoted' && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <FileText className="w-5 h-5" />
                  Đã Báo Giá
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-gray-600">Giá Báo Giá</p>
                  <p className="text-2xl font-bold text-blue-600">{quoteAmount.toString()} đ</p>
                </div>
                <p className="text-gray-700">Khách hàng đang xem xét báo giá của bạn. Vui lòng chờ phản hồi.</p>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">Chỉnh Sửa Báo Giá</Button>
                  <Button variant="outline" className="flex-1">Hủy Báo Giá</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {status === 'in_progress' && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <AlertCircle className="w-5 h-5" />
                  Đang Thực Hiện
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <div className="flex justify-between items-center mb-4">
                    <p className="font-medium text-gray-900">Timeline</p>
                    <span className="text-sm text-purple-600">Còn lại: 3 ngày</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">Báo giá được chấp nhận - 20/06/2024</p>
                        <p className="text-sm text-gray-500">Khách hàng đã xác nhận báo giá</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Đang thực hiện - 21/06/2024</p>
                        <p className="text-sm text-gray-500">Bạn bắt đầu làm việc</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => setShowCompleteModal(true)}
                  className="w-full"
                >
                  Hoàn Thành Booking
                </Button>
              </CardContent>
            </Card>
          )}

          {status === 'completed' && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  Hoàn Thành
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">Booking đã được hoàn thành vào 23/06/2024.</p>
                <p className="text-sm text-gray-500 mt-2">Khách hàng có thể xem kết quả và để lại đánh giá.</p>
              </CardContent>
            </Card>
          )}

          {/* Chat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Chat với Khách Hàng
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-4 space-y-3 max-h-64 overflow-y-auto">
                <div className="text-sm">
                  <p className="text-gray-600">Khách hàng - 14:05</p>
                  <p className="bg-white rounded px-2 py-1">Xin chào, tôi cần một logo đẹp cho công ty</p>
                </div>
                <div className="text-sm">
                  <p className="text-gray-600">Bạn - 14:10</p>
                  <p className="bg-blue-100 rounded px-2 py-1 text-right">Xin chào! Tôi sẵn sàng giúp bạn</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input placeholder="Gửi tin nhắn..." />
                <Button>Gửi</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right - Summary */}
        <div className="space-y-6">
          {/* Price Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Tóm Tắt Giá</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Giá Dịch Vụ</span>
                <span className="font-medium">{quoteAmount.toString()} đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí Hệ Thống (5%)</span>
                <span className="font-medium text-red-600">-{(parseInt(quoteAmount) * 0.05).toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-bold">Nhận Được</span>
                <span className="font-bold text-green-600">{(parseInt(quoteAmount) * 0.95).toLocaleString('vi-VN')} đ</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hành Động</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Liên Hệ Khách Hàng
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600">
                Hủy Booking
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Báo Cáo Vấn Đề
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Lịch Sử</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Tạo - 20/06/2024 14:00</p>
              </div>
              {status !== 'pending' && (
                <div>
                  <p className="text-gray-600">Báo giá - 20/06/2024 14:30</p>
                </div>
              )}
              {status === 'in_progress' && (
                <div>
                  <p className="text-gray-600">Chấp nhận - 20/06/2024 15:00</p>
                </div>
              )}
              {status === 'completed' && (
                <div>
                  <p className="text-gray-600">Hoàn thành - 23/06/2024 10:30</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Complete Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Hoàn Thành Booking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">Vui lòng cung cấp ghi chú hoàn thành trước khi kết thúc booking.</p>
              <textarea
                placeholder="Mô tả kết quả công việc, những gì bạn đã hoàn thành..."
                rows={4}
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  onClick={handleCompleteBooking}
                  disabled={isSubmittingQuote || !completionNote.trim()}
                  className="flex-1"
                >
                  {isSubmittingQuote ? 'Đang xử lý...' : 'Hoàn Thành'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
