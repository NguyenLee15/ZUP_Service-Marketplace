'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminBookingReview } from '../types/admin-booking-detail.types';

interface AdminBookingReviewCardProps {
  review: AdminBookingReview;
}

export function AdminBookingReviewCard({ review }: AdminBookingReviewCardProps) {
  return (
    <Card className="rounded-2xl border-slate-200/80 shadow-sm">
      <CardHeader className="border-b border-slate-100 pb-3">
        <CardTitle className="text-sm font-bold text-slate-800">
          Đánh giá dịch vụ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center gap-1.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-5 w-5 ${
                i < review.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-slate-200'
              }`}
            />
          ))}
          <span className="ml-1.5 text-sm font-bold text-slate-700">
            {review.rating} / 5
          </span>
        </div>
        {review.comment && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
            <p className="text-sm italic leading-relaxed text-slate-600">
              &ldquo;{review.comment}&rdquo;
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

