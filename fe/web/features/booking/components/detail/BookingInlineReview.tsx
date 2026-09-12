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
        <Card className="rounded-xl border border-border bg-card shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Đánh giá của bạn
            </p>
            <div className="flex items-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < booking.review.rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-2 font-medium">
                {booking.review.rating}/5
              </span>
            </div>
            {booking.review.comment && (
              <p className="text-sm text-foreground bg-muted/40 p-3 rounded-lg leading-relaxed">
                {booking.review.comment}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Review form */}
      {showReview && (
        <Card className="rounded-xl border border-border bg-card shadow-sm">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">
              Đánh giá dịch vụ
            </p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  aria-label={`Chọn ${s} sao`}
                  aria-pressed={s === rating}
                  className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 transition-colors ${
                      s <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300 dark:text-slate-700 hover:text-amber-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Gợi ý nhanh
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
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
                    className="px-2.5 py-1 rounded-full border border-border bg-muted/30 text-foreground text-xs hover:bg-muted transition-colors cursor-pointer"
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
                className="pr-24 bg-background border-input text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  setComment(
                    'Dịch vụ rất chuyên nghiệp, thợ đến đúng giờ và xử lý vấn đề cẩn thận. Rất hài lòng với chất lượng của HomeServe!',
                  );
                }}
                className="absolute right-2.5 bottom-2.5 text-[11px] font-medium text-muted-foreground hover:text-sky-600 dark:hover:text-sky-400 transition-colors px-2 py-1 rounded bg-muted/70 hover:bg-muted cursor-pointer"
              >
                Mẫu gợi ý
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
                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-medium"
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

