"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookingListItem,
  BOOKING_STATUS_CONFIG,
} from "../hooks/useAdminBookingsListFlow";

interface AdminBookingListCardProps {
  booking: BookingListItem;
  isSelected: boolean;
  onSelect: () => void;
}

export function AdminBookingListCard({
  booking,
  isSelected,
  onSelect,
}: AdminBookingListCardProps) {
  const statusInfo = BOOKING_STATUS_CONFIG[booking.status] || {
    label: booking.status,
    color: "bg-slate-100 text-slate-700",
  };

  const bookingPrice = booking.quotations?.length
    ? booking.quotations.reduce(
        (sum, q) => sum + Number(q.actualPrice ?? 0),
        0,
      )
    : Number(booking.agreedPrice ?? 0);

  return (
    <Card
      onClick={onSelect}
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected
          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
          : "hover:border-slate-300"
      }`}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-slate-800">
              #{booking.bookingCode}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusInfo.color}`}
            >
              {statusInfo.label}
            </span>
          </div>
          <Link
            href={`/admin/bookings/${booking.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <span>Chi tiết</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">
            {booking.service?.name || "Dịch vụ yêu cầu"}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Ngày tạo: {new Date(booking.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-600 border-t pt-2">
          <span>
            Khách:{" "}
            <strong className="text-slate-800">
              {booking.customer?.fullName || "—"}
            </strong>
          </span>
          <span className="font-semibold text-emerald-600 text-sm">
            {bookingPrice ? `${bookingPrice.toLocaleString("vi-VN")}₫` : "Chưa có giá"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

