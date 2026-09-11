"use client";

import React from "react";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminPermissionGuard } from "@/features/admin/components/AdminPermissionGuard";
import { AdminPermission } from "@/types/admin-permissions";
import {
  useAdminBookingsListFlow,
  BOOKING_STATUS_OPTIONS,
} from "@/features/admin/bookings/hooks/useAdminBookingsListFlow";
import {
  AdminBookingListCard,
  AdminBookingPreviewPanel,
} from "@/features/admin/bookings/components";

function BookingsListContent() {
  const {
    bookings,
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
    refetch,
  } = useAdminBookingsListFlow();

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản Lý Đơn Hàng
          </h1>
          <p className="text-sm text-slate-500">
            Theo dõi, tra cứu dòng trạng thái và quản lý đơn đặt dịch vụ toàn hệ thống
          </p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {BOOKING_STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setFilterStatus(opt.value);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filterStatus === opt.value
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã, tên, dịch vụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
      </div>

      {/* Master-Detail Split Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Booking Cards List */}
        <div className="lg:col-span-5 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Đang tải danh sách đơn hàng...</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center text-slate-500 bg-white">
              <AlertCircle className="h-10 w-10 text-slate-400 mb-2" />
              <p className="font-semibold text-sm">Không tìm thấy đơn hàng nào</p>
              <p className="text-xs text-slate-400 mt-1">
                Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2.5">
                {bookings.map((booking) => (
                  <AdminBookingListCard
                    key={booking.id}
                    booking={booking}
                    isSelected={selectedBooking?.id === booking.id}
                    onSelect={() => setSelectedBooking(booking)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">
                    Trang {page} / {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Active Booking Preview Panel */}
        <div className="lg:col-span-7">
          <div className="sticky top-20">
            <AdminBookingPreviewPanel
              bookingId={selectedBooking?.id || null}
              onCancelSuccess={refetch}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <AdminPermissionGuard permission={AdminPermission.BOOKING_VIEW}>
      <BookingsListContent />
    </AdminPermissionGuard>
  );
}
