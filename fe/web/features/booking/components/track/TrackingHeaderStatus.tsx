"use client";

import React from "react";
import { Navigation } from "lucide-react";
import { ProviderLocation } from "../../hooks/useBookingTrackingFlow";

interface TrackingHeaderStatusProps {
  providerLoc: ProviderLocation | null;
  distance: number | null;
  eta: string;
  isWaitingGps?: boolean;
}

export function TrackingHeaderStatus({
  providerLoc,
  distance,
  eta,
  isWaitingGps,
}: TrackingHeaderStatusProps) {
  if (!providerLoc || distance === null) {
    if (isWaitingGps) {
      return (
        <div className="absolute top-4 right-4 z-[1000] glass-panel rounded-2xl p-3 shadow-lg max-w-[220px] border border-border/60 bg-background/85 backdrop-blur">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="font-medium text-[11px] text-foreground leading-snug">
              Đang đợi thợ kết nối tín hiệu GPS...
            </span>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-[1000] glass-panel rounded-2xl p-4 shadow-lg min-w-[160px]">
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
          Thời gian đến
        </p>
        <p className="text-3xl font-bold text-action-blue">{eta}</p>
        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <Navigation className="w-3 h-3" />
          <span>{distance.toFixed(1)} km</span>
          <span className="mx-1">•</span>
          <span>{Math.round(providerLoc.speed)} km/h</span>
        </div>
      </div>
    </div>
  );
}

