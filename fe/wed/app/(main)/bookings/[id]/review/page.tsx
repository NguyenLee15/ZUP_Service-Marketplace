'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Star, Send } from 'lucide-react'
import { BackButton } from '@/components/navigation/BackButton'

import { use } from 'react';

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
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
    <div className="p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <BackButton fallbackHref={`/bookings/${id}`} className="mb-6" />

        {/* Review Card */}
        <Card className="surface-card rounded-[20px] p-6 md:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold brand-heading mb-2">Đánh giá dịch vụ</h1>
            <p className="text-muted-foreground">Hãy chia sẻ trải nghiệm của bạn để giúp cải thiện dịch vụ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Section */}
            <div className="text-center">
              <p className="text-foreground font-medium mb-4">Bạn thấy dịch vụ này như thế nào?</p>
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
                            : 'text-platinum-tint'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
              {rating > 0 && (
                <p className="text-sm text-muted-foreground">
                  {rating === 5 && 'Tuyệt vời'}
                  {rating === 4 && 'Rất tốt'}
                  {rating === 3 && 'Bình thường'}
                  {rating === 2 && 'Chưa tốt'}
                  {rating === 1 && 'Rất không hài lòng'}
                </p>
              )}
            </div>

            {/* Comment Section */}
            <div>
              <label className="block text-foreground font-medium mb-3">Nhận xét (tùy chọn)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Chia sẻ chi tiết về trải nghiệm của bạn với dịch vụ này..."
                maxLength={500}
                rows={5}
                className="w-full px-4 py-3 border border-platinum-tint rounded-lg focus:outline-none focus:ring-2 focus:ring-action-blue resize-none"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {comment.length}/500 ký tự
              </p>
            </div>

            {/* Helpful Tips */}
            <div className="bg-pale-gray/60 border border-platinum-tint rounded-lg p-4">
              <p className="text-sm font-medium text-foreground mb-2">Mẹo viết đánh giá tốt:</p>
              <ul className="text-sm text-slate-blue space-y-1">
                <li>✓ Mô tả chi tiết về chất lượng dịch vụ</li>
                <li>✓ Nhắc đến thái độ và kỹ năng của nhân viên</li>
                <li>✓ Đề cập đến giá trị tiền tệ</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="w-full bg-action-blue hover:bg-glacier-blue disabled:bg-steel-gray text-white font-semibold py-3 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
            </Button>

            {rating === 0 && (
              <p className="text-sm text-red-600 text-center">Vui lòng chọn mức đánh giá</p>
            )}
          </form>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-platinum-tint">
            <p className="text-xs text-muted-foreground text-center">
              Đánh giá của bạn sẽ được công khai để giúp các khách hàng khác. Vui lòng viết nội dung đúng trải nghiệm thực tế.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
