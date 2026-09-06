'use client';

import React from 'react';
import { FileText, Camera, MapPin, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DisputeBookingInfo } from '../types/dispute-detail.types';

interface DisputePartiesSectionProps {
  booking?: DisputeBookingInfo | null;
  quotationPrice: number | null;
  onOpenLightbox: (url: string) => void;
}

export function DisputePartiesSection({
  booking,
  quotationPrice,
  onOpenLightbox,
}: DisputePartiesSectionProps) {
  const formatPrice = (p: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const fullAddress = [
    booking?.addressDetail,
    booking?.ward,
    booking?.district,
    booking?.province,
  ]
    .filter(Boolean)
    .filter((p) => p !== 'Không áp dụng')
    .join(', ');

  const resultAttachments =
    booking?.attachments?.filter((a) => a.type === 'RESULT') || [];

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      {/* Booking Info */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-800">
              Thông tin đơn hàng
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Dịch vụ</span>
            <span className="max-w-[60%] truncate text-right font-semibold text-slate-800">
              {booking?.service?.name || '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Nhà cung cấp</span>
            <span className="font-semibold text-slate-800">
              {booking?.provider?.fullName || '—'}
            </span>
          </div>
          {quotationPrice != null && (
            <div className="flex justify-between">
              <span className="text-slate-500">Giá trị đơn</span>
              <span className="text-lg font-bold text-blue-700">
                {formatPrice(quotationPrice)}
              </span>
            </div>
          )}
          {booking?.quotation?.commissionRateSnapshot != null && (
            <div className="flex justify-between">
              <span className="text-slate-500">Hoa hồng snapshot</span>
              <span className="font-semibold text-amber-600">
                {booking.quotation.commissionRateSnapshot}%
              </span>
            </div>
          )}
          <div className="border-t border-slate-100 pt-2">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" /> Địa chỉ
            </span>
            <p className="mt-1 text-xs leading-relaxed text-slate-700">
              {fullAddress || '—'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Provider's Result Images */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
              <Camera className="h-4 w-4 text-indigo-600" />
            </div>
            <CardTitle className="text-sm font-bold text-slate-800">
              Ảnh kết quả của thợ
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {resultAttachments.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {resultAttachments.map((att, i) => (
                <button
                  key={att.id || i}
                  type="button"
                  onClick={() => onOpenLightbox(att.fileUrl)}
                  className="group relative aspect-video overflow-hidden rounded-xl border border-slate-200 transition-all hover:border-indigo-300 hover:shadow-md"
                >
                  <img
                    src={att.fileUrl}
                    alt={`Ảnh kết quả ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                    <ImageIcon className="h-5 w-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">
              <Camera className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-xs">Thợ chưa gửi ảnh kết quả</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

