"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { adminApi } from "@/features/admin/services/admin.api";

export interface BookingListItem {
  id: number;
  bookingCode: string;
  status: string;
  createdAt: string;
  agreedPrice?: number;
  customer?: {
    id: number;
    fullName: string;
    phone?: string;
    avatarUrl?: string;
  };
  provider?: {
    id: number;
    fullName: string;
    phone?: string;
    avatarUrl?: string;
  };
  service?: {
    id: number;
    name: string;
    imageUrl?: string;
  };
  quotations?: Array<{
    id: number;
    actualPrice: number;
    status: string;
  }>;
}

export const BOOKING_STATUS_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  PENDING: { label: "Chờ Báo Giá", color: "bg-yellow-100 text-yellow-800" },
  QUOTED: { label: "Đã Báo Giá", color: "bg-indigo-100 text-indigo-800" },
  CONFIRMED: { label: "Đã Xác Nhận", color: "bg-blue-100 text-blue-800" },
  IN_PROGRESS: {
    label: "Đang Thực Hiện",
    color: "bg-purple-100 text-purple-800",
  },
  DONE: { label: "Hoàn Thành", color: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Đã Hủy", color: "bg-muted text-foreground" },
  DISPUTED: { label: "Tranh Chấp", color: "bg-red-100 text-red-800" },
};

export const BOOKING_STATUS_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "PENDING", label: "Chờ Báo Giá" },
  { value: "QUOTED", label: "Đã Báo Giá" },
  { value: "CONFIRMED", label: "Đã Xác Nhận" },
  { value: "IN_PROGRESS", label: "Đang Thực Hiện" },
  { value: "DONE", label: "Hoàn Thành" },
  { value: "CANCELLED", label: "Đã Hủy" },
  { value: "DISPUTED", label: "Tranh Chấp" },
];

export function useAdminBookingsListFlow() {
  const [bookings, setBookings] = useState<BookingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBooking, setSelectedBooking] =
    useState<BookingListItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = useCallback(() => {
    setLoading(true);
    const params: Record<string, unknown> = { page, limit: 10 };
    if (filterStatus !== "all") params.status = filterStatus;

    adminApi
      .getBookings(params)
      .then((res) => {
        const data = (res.data?.data || []) as BookingListItem[];
        setBookings(data);
        setTotalPages(res.data?.meta?.totalPages || 1);
        if (data.length > 0 && !selectedBooking) {
          setSelectedBooking(data[0]);
        }
      })
      .catch(() => {
        setBookings([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [filterStatus, page, selectedBooking]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return bookings;
    return bookings.filter(
      (b) =>
        (b.bookingCode?.toLowerCase() || "").includes(term) ||
        (b.customer?.fullName?.toLowerCase() || "").includes(term) ||
        (b.provider?.fullName?.toLowerCase() || "").includes(term) ||
        (b.service?.name?.toLowerCase() || "").includes(term),
    );
  }, [bookings, searchTerm]);

  return {
    bookings: filteredBookings,
    loading,
    searchTerm,
    setSearchTerm,
    selectedBooking,
    setSelectedBooking,
    filterStatus,
    setFilterStatus,
    page,
    setPage,
    totalPages,
    refetch: fetchBookings,
  };
}

