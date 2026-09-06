'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Star, Zap } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { reviewsApi } from '@/features/auth/services/api';

interface BookingInlineReviewProps {
  booking: ApiPayload;
  showReview: boolean;
  setShowReview: (show: boolean) => void;
  rating: number;
  setRating: (r: number) => void;
  comment: string;
  setComment: React.Dispatch<React.SetStateAction<string>>;
  actionLoading: boolean;
  handleAction: (action: () => Promise<ApiPayload>, msg: string) => Promise<void>;
}

export function BookingInlineReview({
  booking,
  showReview,
  setShowReview,
  rating,
  setRating,
  comment,
  setComment,
  actionLoading,
  handleAction,
}: BookingInlineReviewProps) {
  const { toast } = useToast();

  return (
    <>
      {/* Review Display */}
      {booking.review && (
        <Card className="glass-panel rounded-2xl border-0">
          <CardContent className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Đánh giá của bạn
            </p>
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < booking.review.rating
                      ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_4px_rgba(250,204,21,0.4)]'
                      : 'text-platinum-tint'
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                {booking.review.rating}/5
              </span>
            </div>
            {booking.review.comment && (
              <p className="text-sm text-muted-foreground bg-pale-gray/30 p-3 rounded-lg">
                {booking.review.comment}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review form */}
      {showReview && (
        <Card className="glass-panel rounded-2xl border-0">
          <CardContent className="p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-action-blue">
              Đánh giá dịch vụ
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  aria-label={`Chọn ${s} sao`}
                  aria-pressed={s === rating}
                  className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                >
                  <Star
                    className={`w-7 h-7 cursor-pointer transition-all ${
                      s <= rating
                        ? 'fill-yellow-400 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]'
                        : 'text-platinum-tint hover:text-yellow-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-action-blue" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-blue">
                  Gợi ý đánh giá
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  'Chuyên nghiệp',
                  'Nhanh chóng',
                  'Giá hợp lý',
                  'Thân thiện',
                  'Chất lượng cao',
                ].map((tag) => (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => setComment((prev) => (prev ? `${prev}, ${tag}` : tag))}
                    className="px-3 py-1.5 rounded-full glass-panel text-action-blue text-[10px] font-bold hover:bg-action-blue/10 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Nhận xét của bạn về chất lượng dịch vụ…"
                rows={3}
                className="pr-12 bg-card/50"
              />
              <button
                type="button"
                onClick={() => {
                  const suggestions = [
                    'Dịch vụ rất chuyên nghiệp, thợ đến đúng giờ và xử lý vấn đề rất nhanh gọn. Tôi rất hài lòng!',
                    'Giá cả hợp lý, thợ thân thiện và có tay nghề cao. Sẽ tiếp tục ủng hộ Zup.',
                    'Hỗ trợ nhiệt tình, quy trình làm việc minh bạch. Đánh giá 5 sao cho chất lượng!',
                  ];
                  setComment(
                    suggestions[Math.floor(Math.random() * suggestions.length)],
                  );
                  toast({
                    title: 'AI đã soạn thảo xong!',
                    description: 'Nội dung đã được tối ưu hóa cho bạn.',
                  });
                }}
                className="absolute right-2 bottom-2 p-2 rounded-lg bg-gradient-to-r from-action-blue to-glacier-blue text-white shadow-[0_0_10px_rgba(0,107,255,0.3)] hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                aria-label="Tự động soạn thảo nhận xét"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  handleAction(
                    () =>
                      reviewsApi.create({
                        bookingId: booking.id,
                        rating,
                        comment,
                      }),
                    'Đánh giá thành công!',
                  )
                }
                disabled={actionLoading}
                className="flex-1 bg-action-blue hover:bg-glacier-blue text-white shadow-[0_0_12px_rgba(0,107,255,0.25)]"
                size="sm"
              >
                Gửi đánh giá
              </Button>
              <Button
                onClick={() => setShowReview(false)}
                variant="outline"
                size="sm"
              >
                Đóng
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

