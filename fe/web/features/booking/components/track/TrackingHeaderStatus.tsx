"use client";

import React from "react";
import { Navigation } from "lucide-react";
import { ProviderLocation } from "../../hooks/useBookingTrackingFlow";

interface TrackingHeaderStatusProps {
  providerLoc: ProviderLocation | null;
  distance: number | null;
  eta: string;
}

export function TrackingHeaderStatus({
  providerLoc,
  distance,
  eta,
}: TrackingHeaderStatusProps) {
  if (!providerLoc || distance === null) return null;

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

