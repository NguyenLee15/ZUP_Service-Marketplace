'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface ServiceReviewsListProps {
  reviews: ApiPayload[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onLoadMore: () => void;
}

export function ServiceReviewsList({
  reviews,
  total,
  hasMore,
  loading,
  error,
  onRetry,
  onLoadMore,
}: ServiceReviewsListProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-4 text-foreground">
        Đánh giá ({total})
      </h2>
      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">Chưa có đánh giá nào</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: ApiPayload) => (
            <div key={review.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                {review.customer?.fullName?.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">
                    {review.customer?.fullName}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground/30'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          ))}
          {error ? (
            <div role="alert" className="flex items-center gap-3 text-sm text-rose-600">
              <span>{error}</span>
              <button type="button" className="font-semibold underline" onClick={onRetry}>
                Thử lại
              </button>
            </div>
          ) : null}
          {hasMore ? (
            <button
              type="button"
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-60"
              onClick={onLoadMore}
              disabled={loading}
            >
              {loading ? 'Đang tải...' : 'Xem thêm'}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}

