'use client';

import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminBookingDetailData } from '../types/admin-booking-detail.types';

interface AdminBookingPartiesCardProps {
  booking: AdminBookingDetailData;
}

export function AdminBookingPartiesCard({ booking }: AdminBookingPartiesCardProps) {
  const fullAddress = [
    booking.addressDetail,
    booking.ward,
    booking.district,
    booking.province,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      {/* Parties involved */}
      <Card className="overflow-hidden rounded-2xl border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-3">
          <CardTitle className="text-sm font-bold text-slate-800">
            Đối tác giao dịch
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 text-sm">
          {/* Customer */}
          <div className="space-y-2.5 border-b border-slate-100 pb-4">
            <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-blue-600">
              Khách hàng
            </span>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                {booking.customer?.fullName?.charAt(0) || 'K'}
              </div>
              <div>
                <p className="font-bold leading-none text-slate-800">
                  {booking.customer?.fullName || 'Ẩn danh'}
                </p>
                {booking.customer?.email && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                    <Mail className="h-3 w-3" /> {booking.customer.email}
                  </p>
                )}
                {booking.customer?.phone && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                    <Phone className="h-3 w-3" /> {booking.customer.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Provider */}
          <div className="space-y-2.5 pt-2">
            <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
              Thợ / Nhà cung cấp
            </span>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                {booking.provider?.fullName?.charAt(0) || 'T'}
              </div>
              <div>
                <p className="font-bold leading-none text-slate-800">
                  {booking.provider?.fullName || 'Chưa nhận đơn'}
                </p>
                {booking.provider?.email && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                    <Mail className="h-3 w-3" /> {booking.provider.email}
                  </p>
                )}
                {booking.provider?.phone && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                    <Phone className="h-3 w-3" /> {booking.provider.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address details */}
      <Card className="rounded-2xl border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100 pb-3">
          <CardTitle className="text-sm font-bold text-slate-800">
            Địa chỉ thi công
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4 text-sm leading-relaxed">
          <div className="flex items-start gap-2 text-slate-700">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span>{fullAddress || 'Không có thông tin địa chỉ'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

