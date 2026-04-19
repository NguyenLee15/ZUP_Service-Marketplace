'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Star, ChevronLeft, Send } from 'lucide-react'

export default function ReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return

    setIsSubmitting(true)
    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false)
      router.push('/bookings')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <Link href={`/bookings/${params.id}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
          <ChevronLeft className="w-5 h-5" />
          Quay Lại
        </Link>

        {/* Review Card */}
        <Card className="p-6 md:p-8 border border-gray-200">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Đánh Giá Dịch Vụ</h1>
            <p className="text-gray-600">Hãy chia sẻ trải nghiệm của bạn để giúp cải thiện dịch vụ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Section */}
            <div className="text-center">
              <p className="text-gray-700 font-medium mb-4">Bạn Thấy Dịch Vụ Này Như Thế Nào?</p>
              <div className="flex items-center justify-center gap-2 mb-2">
                {Array(5).fill(0).map((_, idx) => {
                  const fillRating = hoveredRating || rating
                  const isFilled = idx < fillRating
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRating(idx + 1)}
                      onMouseEnter={() => setHoveredRating(idx + 1)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="p-1 transition transform hover:scale-110"
                    >
                      <Star
                        className={`w-12 h-12 transition ${
                          isFilled
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600">
                  {rating === 5 && 'Tuyệt vời!'}
                  {rating === 4 && 'Rất tốt!'}
                  {rating === 3 && 'Bình thường'}
                  {rating === 2 && 'Chưa tốt'}
                  {rating === 1 && 'Rất không hài lòng'}
                </p>
              )}
            </div>

            {/* Comment Section */}
            <div>
              <label className="block text-gray-700 font-medium mb-3">Nhận Xét (Tùy Chọn)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ chi tiết về trải nghiệm của bạn với dịch vụ này..."
                maxLength={500}
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                {comment.length}/500 ký tự
              </p>
            </div>

            {/* Helpful Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">Mẹo Viết Đánh Giá Tốt:</p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Mô tả chi tiết về chất lượng dịch vụ</li>
                <li>✓ Nhắc đến thái độ và kỹ năng của nhân viên</li>
                <li>✓ Đề cập đến giá trị tiền tệ</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Đang Gửi...' : 'Gửi Đánh Giá'}
            </Button>

            {rating === 0 && (
              <p className="text-sm text-red-600 text-center">Vui lòng chọn mức đánh giá</p>
            )}
          </form>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Đánh giá của bạn sẽ được công khai để giúp các khách hàng khác. Vui lòng tuân thủ{' '}
              <Link href="#" className="text-blue-600 hover:text-blue-700">
                Chính Sách Đánh Giá
              </Link>
              .
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
