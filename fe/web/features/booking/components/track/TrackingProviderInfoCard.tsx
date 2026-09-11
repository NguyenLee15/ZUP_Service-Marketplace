"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  Truck,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { ProviderLocation } from "../../hooks/useBookingTrackingFlow";

const TRACK_STATUSES = [
  { key: "accepted", label: "Đã nhận đơn", icon: CheckCircle2, done: true },
  { key: "on_the_way", label: "Đang di chuyển", icon: Truck, done: false },
  { key: "arrived", label: "Đã đến nơi", icon: MapPin, done: false },
  { key: "working", label: "Đang thực hiện", icon: RefreshCw, done: false },
];

interface TrackingProviderInfoCardProps {
  booking: any;
  currentStepIdx: number;
  providerLoc: ProviderLocation | null;
}

export function TrackingProviderInfoCard({
  booking,
  currentStepIdx,
  providerLoc,
}: TrackingProviderInfoCardProps) {
  const router = useRouter();
  const provider = booking?.provider;

  return (
    <div className="glass-panel rounded-t-3xl p-5 pb-6 shadow-[0_-4px_30px_rgba(0,0,0,0.1)] z-[1000] relative">
      {/* Mini Progress Steps */}
      <div className="flex items-center justify-between mb-5 px-2">
        {TRACK_STATUSES.map((step, idx) => {
          const isActive = idx === currentStepIdx;
          const isDone = idx < currentStepIdx || step.done;
          const Icon = step.icon;
          return (
            <div
              key={step.key}
              className="flex flex-col items-center gap-1.5 flex-1 relative"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isDone
                    ? "bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : isActive
                      ? "bg-gradient-to-br from-action-blue to-glacier-blue text-white shadow-[0_0_12px_rgba(0,107,255,0.3)] animate-pulse"
                      : "glass-panel text-muted-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`text-[9px] font-bold uppercase tracking-wider text-center leading-tight ${
                  isDone || isActive
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Provider Info */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-action-blue to-glacier-blue flex items-center justify-center text-white text-lg font-bold shrink-0 overflow-hidden shadow-[0_0_15px_rgba(0,107,255,0.3)]">
          {provider?.avatarUrl ? (
            <img
              src={provider.avatarUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            provider?.fullName?.charAt(0) || "?"
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Thợ đang đến
          </p>
          <h3 className="text-base font-bold text-foreground truncate">
            {provider?.fullName || "Đang cập nhật…"}
          </h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3" />
            Mã đơn: #{booking.bookingCode}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() =>
              provider?.phone && window.open(`tel:${provider.phone}`)
            }
            className="w-11 h-11 rounded-full bg-green-500 text-white flex items-center justify-center shadow-[0_0_12px_rgba(22,163,74,0.3)] hover:bg-green-600 transition-colors active:scale-95"
            aria-label="Gọi điện cho thợ"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={() =>
              router.push(
                `/chat?conversationId=${booking.conversationId || ""}`,
              )
            }
            className="w-11 h-11 rounded-full bg-gradient-to-r from-action-blue to-glacier-blue text-white flex items-center justify-center shadow-[0_0_12px_rgba(0,107,255,0.3)] hover:from-glacier-blue hover:to-action-blue transition-all active:scale-95"
            aria-label="Nhắn tin cho thợ"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Live Indicator */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        Đang theo dõi trực tiếp
        {providerLoc && (
          <span className="text-[10px] text-slate-blue">
            • Cập nhật{" "}
            {providerLoc.updatedAt.toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        )}
      </div>
    </div>
  );
}

