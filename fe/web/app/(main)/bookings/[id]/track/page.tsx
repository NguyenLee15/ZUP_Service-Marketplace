"use client";

import { use } from "react";
import dynamic from "next/dynamic";
import { BookingStatus } from "@/types";
import { BackButton } from "@/components/navigation/BackButton";
import { Button } from "@/components/ui/button";
import { Navigation, AlertCircle, Locate } from "lucide-react";
import { useBookingTrackingFlow } from "@/features/booking/hooks/useBookingTrackingFlow";
import { TrackingHeaderStatus } from "@/features/booking/components/track/TrackingHeaderStatus";
import { TrackingProviderInfoCard } from "@/features/booking/components/track/TrackingProviderInfoCard";

// Dynamic import to avoid SSR issues with Leaflet
const TrackingMap = dynamic(() => import("./TrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full glass-panel rounded-2xl flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="w-10 h-10 rounded-full bg-action-blue/10 flex items-center justify-center animate-pulse">
          <Navigation className="w-5 h-5 text-action-blue" />
        </div>
        <span className="text-sm font-medium">Đang tải bản đồ…</span>
      </div>
    </div>
  ),
});

export default function TrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const {
    booking,
    loading,
    error,
    isTrackable,
    providerLoc,
    customerLoc,
    trail,
    currentStepIdx,
    distance,
    eta,
    router,
  } = useBookingTrackingFlow(id);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="h-[80vh] glass-panel rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <BackButton fallbackHref="/bookings" className="mb-4" />
        <div className="glass-panel rounded-2xl p-8 flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-lg font-semibold text-foreground">
            {error || "Không tìm thấy đơn hàng"}
          </p>
          <Button
            onClick={() => router.push("/bookings")}
            className="bg-action-blue text-white rounded-xl"
          >
            Quay lại danh sách
          </Button>
        </div>
      </div>
    );
  }

  if (!isTrackable) {
    let title = "Chưa thể theo dõi lộ trình";
    let description =
      "Bản đồ theo dõi trực tiếp sẽ sẵn sàng ngay khi thợ bắt đầu di chuyển tới địa chỉ của bạn.";
    let iconColor = "text-amber-500";
    let iconBg = "bg-amber-500/10";
    let statusLabel = "Chờ thợ xuất phát";

    if (booking.status === BookingStatus.DONE) {
      title = "Lộ trình đã kết thúc";
      description =
        "Đơn hàng đã hoàn thành xuất sắc! Hệ thống đã dừng theo dõi trực tiếp lộ trình thợ.";
      iconColor = "text-green-500";
      iconBg = "bg-green-500/10";
      statusLabel = "Đã hoàn thành";
    } else if (booking.status === BookingStatus.CANCELLED) {
      title = "Tính năng theo dõi đã đóng";
      description =
        "Đơn hàng này đã bị hủy. Không thể theo dõi lộ trình di chuyển.";
      iconColor = "text-red-500";
      iconBg = "bg-red-500/10";
      statusLabel = "Đã hủy đơn";
    } else if (booking.status === BookingStatus.DISPUTED) {
      title = "Tạm ngưng theo dõi lộ trình";
      description =
        "Đơn hàng đang ở trạng thái khiếu nại. Dịch vụ định vị tạm thời ngưng hoạt động.";
      iconColor = "text-purple-500";
      iconBg = "bg-purple-500/10";
      statusLabel = "Đang khiếu nại";
    }

    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <BackButton fallbackHref={`/bookings/${id}`} className="mb-6" />
        <div className="glass-panel rounded-3xl p-8 flex flex-col items-center gap-6 shadow-xl relative overflow-hidden border border-white/5">
          <div className="absolute inset-0 bg-gradient-to-br from-action-blue/5 via-transparent to-transparent pointer-events-none" />

          <div
            className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center`}
          >
            <Navigation className={`w-8 h-8 ${iconColor} animate-pulse`} />
          </div>

          <div className="space-y-2">
            <span className="inline-block text-[10px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 font-bold text-action-blue uppercase tracking-wider">
              {statusLabel}
            </span>
            <h1 className="text-xl font-extrabold text-foreground tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>

          <div className="w-full pt-2 flex flex-col gap-2">
            <Button
              onClick={() => router.push(`/bookings/${id}`)}
              className="w-full bg-gradient-to-r from-action-blue to-glacier-blue hover:from-glacier-blue hover:to-action-blue text-white rounded-xl py-5 font-bold shadow-lg"
            >
              Xem chi tiết đơn hàng
            </Button>
            <Button
              onClick={() => router.push("/bookings")}
              variant="ghost"
              className="w-full rounded-xl text-muted-foreground"
            >
              Quay lại danh sách đơn
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100dvh-5rem)] flex flex-col">
      {/* Map Area — takes full height */}
      <div className="flex-1 relative">
        <TrackingMap
          providerLocation={providerLoc}
          customerLocation={customerLoc}
          trail={trail}
        />

        {/* Floating Back Button */}
        <div className="absolute top-4 left-4 z-[1000]">
          <BackButton
            fallbackHref={`/bookings/${id}`}
            className="glass-panel rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-shadow"
          />
        </div>

        {/* Floating ETA Card */}
        <TrackingHeaderStatus
          providerLoc={providerLoc}
          distance={distance}
          eta={eta}
        />

        {/* Re-center Button */}
        <button
          onClick={() => {}}
          className="absolute bottom-48 right-4 z-[1000] w-10 h-10 glass-panel rounded-full flex items-center justify-center shadow-lg hover:bg-action-blue/10 transition-colors"
          aria-label="Về vị trí của tôi"
        >
          <Locate className="w-5 h-5 text-action-blue" />
        </button>
      </div>

      {/* Bottom Panel — Provider Info + Progress */}
      <TrackingProviderInfoCard
        booking={booking}
        currentStepIdx={currentStepIdx}
        providerLoc={providerLoc}
      />
    </div>
  );
}
