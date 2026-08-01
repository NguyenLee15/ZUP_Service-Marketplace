'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Star, Send, Sparkles, Zap, Lightbulb } from 'lucide-react'
import { BackButton } from '@/components/navigation/BackButton'

import { use } from 'react';

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const quickTags = [
    'Chuyên nghiệp',
    'Nhanh chóng',
    'Giá hợp lý',
    'Thân thiện',
    'Sạch sẽ',
    'Đúng giờ',
    'Chất lượng cao',
    'Tận tâm',
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      const { reviewsApi } = await import('@/features/auth/services/api');
      const { toast } = await import('sonner');
      await reviewsApi.create({ bookingId: Number(id), rating, comment });
      toast.success('Đánh giá thành công');
      router.push('/bookings');
    } catch (error) {
      const { toast } = await import('sonner');
      toast.error('Có lỗi xảy ra khi gửi đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoSuggest = () => {
    const suggestions = [
      'Dịch vụ rất chuyên nghiệp, thợ đến đúng giờ và xử lý vấn đề rất nhanh gọn. Tôi rất hài lòng!',
      'Giá cả hợp lý, thợ thân thiện và có tay nghề cao. Sẽ tiếp tục ủng hộ Zup.',
      'Hỗ trợ nhiệt tình, quy trình làm việc minh bạch. Đánh giá 5 sao cho chất lượng!',
      'Thợ làm việc rất cẩn thận, dọn dẹp sạch sẽ sau khi hoàn thành. Rất đáng tin cậy.',
    ]
    setComment(suggestions[Math.floor(Math.random() * suggestions.length)])
  }

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <BackButton fallbackHref={`/bookings/${id}`} className="mb-6" />

        {/* Review Card */}
        <Card className="glass-panel glow-hover rounded-2xl p-6 md:p-8 border-0">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
              <Star className="w-8 h-8 text-white fill-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Đánh giá dịch vụ</h1>
            <p className="text-muted-foreground">Hãy chia sẻ trải nghiệm của bạn để giúp cải thiện dịch vụ</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Section */}
            <div className="text-center">
              <p className="text-foreground font-medium mb-4">Bạn thấy dịch vụ này như thế nào?</p>
              <div className="flex items-center justify-center gap-3 mb-3">
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
                      className="p-1 transition-all duration-200 hover:scale-125 active:scale-95"
                    >
                      <Star
                        className={`w-12 h-12 transition-all duration-200 ${
                          isFilled
                            ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                            : 'text-platinum-tint hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  )
                })}
              </div>
              {rating > 0 && (
                <div className="inline-flex items-center px-3 py-1 rounded-full glass-panel text-sm font-semibold text-action-blue">
                  {rating === 5 && '⭐ Tuyệt vời'}
                  {rating === 4 && '👍 Rất tốt'}
                  {rating === 3 && '😐 Bình thường'}
                  {rating === 2 && '😕 Chưa tốt'}
                  {rating === 1 && '😞 Rất không hài lòng'}
                </div>
              )}
            </div>

            {/* Quick Tags */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-action-blue" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-blue">
                  Chọn nhanh nhận xét
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {quickTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setComment((prev) => (prev ? `${prev}, ${tag}` : tag))
                    }
                    className="px-3 py-1.5 rounded-full glass-panel text-action-blue text-xs font-semibold hover:bg-action-blue/10 transition-colors active:scale-95"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Section */}
            <div>
              <label className="block text-foreground font-medium mb-3">Nhận xét (tùy chọn)</label>
              <div className="relative">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ chi tiết về trải nghiệm của bạn với dịch vụ này…"
                  maxLength={500}
                  rows={5}
                  className="w-full px-4 py-3 border border-platinum-tint rounded-xl focus:outline-none focus:ring-2 focus:ring-action-blue resize-none bg-card/50 pr-12"
                />
                <button
                  type="button"
                  onClick={handleAutoSuggest}
                  className="absolute right-3 bottom-3 p-2 rounded-lg bg-gradient-to-r from-action-blue to-glacier-blue text-white shadow-[0_0_10px_rgba(0,107,255,0.3)] hover:scale-105 transition-transform"
                  aria-label="AI soạn thảo tự động"
                >
                  <Zap className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {comment.length}/500 ký tự
              </p>
            </div>

            {/* Helpful Tips */}
            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-pop" />
                <p className="text-sm font-medium text-foreground">Mẹo viết đánh giá tốt:</p>
              </div>
              <ul className="text-sm text-slate-blue space-y-1.5 ml-6">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-action-blue/50 shrink-0" />
                  Mô tả chi tiết về chất lượng dịch vụ
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-action-blue/50 shrink-0" />
                  Nhắc đến thái độ và kỹ năng của nhân viên
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-action-blue/50 shrink-0" />
                  Đề cập đến giá trị tiền tệ
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="w-full bg-action-blue hover:bg-glacier-blue disabled:bg-steel-gray text-white font-semibold py-3 flex items-center justify-center gap-2 rounded-xl shadow-[0_0_15px_rgba(0,107,255,0.25)] transition-all hover:-translate-y-0.5"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Đang gửi…' : 'Gửi đánh giá'}
            </Button>

            {rating === 0 && (
              <p className="text-sm text-red-600 text-center">Vui lòng chọn mức đánh giá</p>
            )}
          </form>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-action-blue/10">
            <p className="text-xs text-muted-foreground text-center">
              Đánh giá của bạn sẽ được công khai để giúp các khách hàng khác. Vui lòng viết nội dung đúng trải nghiệm thực tế.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
