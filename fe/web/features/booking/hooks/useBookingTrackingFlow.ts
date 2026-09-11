"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { bookingApi } from "@/features/booking/services/booking.api";
import { BookingStatus } from "@/types";
import { getTrackingSocket } from "@/lib/socket";

export interface ProviderLocation {
  lat: number;
  lng: number;
  heading: number;
  speed: number;
  updatedAt: Date;
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatETA(distKm: number, speedKmh: number): string {
  if (speedKmh <= 0) return "—";
  const mins = Math.round((distKm / speedKmh) * 60);
  if (mins < 1) return "Sắp đến";
  if (mins < 60) return `${mins} phút`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m > 0 ? ` ${m}p` : ""}`;
}

export function useBookingTrackingFlow(id: string) {
  const router = useRouter();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [, setTrackingEnded] = useState(false);
  const [providerLoc, setProviderLoc] = useState<ProviderLocation | null>(null);
  const [trail, setTrail] = useState<[number, number][]>([]);
  const [customerLoc, setCustomerLoc] = useState<{ lat: number; lng: number }>({
    lat: 21.028511,
    lng: 105.854167,
  });
  const [currentStepIdx, setCurrentStepIdx] = useState(1);
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const socketConnectedRef = useRef(false);

  // ---- Fetch booking ----
  useEffect(() => {
    setLoading(true);
    bookingApi
      .getById(Number(id))
      .then((res: any) => {
        const data = res.data.data || res.data;
        setBooking(data);

        if (data) {
          const province = (data.province || "").toLowerCase();
          if (
            province.includes("hồ chí minh") ||
            province.includes("hcm") ||
            province.includes("sài gòn")
          ) {
            setCustomerLoc({ lat: 10.762622, lng: 106.660172 });
          } else if (province.includes("đà nẵng")) {
            setCustomerLoc({ lat: 16.047079, lng: 108.20623 });
          } else if (province.includes("cần thơ")) {
            setCustomerLoc({ lat: 10.045162, lng: 105.746857 });
          } else if (province.includes("hải phòng")) {
            setCustomerLoc({ lat: 20.844912, lng: 106.688087 });
          } else {
            setCustomerLoc({ lat: 21.028511, lng: 105.854167 });
          }

          if (data.status === BookingStatus.CONFIRMED) {
            setCurrentStepIdx(1);
          } else if (data.status === BookingStatus.IN_PROGRESS) {
            setCurrentStepIdx(3);
          } else if (data.status === BookingStatus.DONE) {
            setCurrentStepIdx(3);
          } else {
            setCurrentStepIdx(0);
          }
        }
      })
      .catch(() => setError("Không tìm thấy đơn hàng"))
      .finally(() => setLoading(false));
  }, [id]);

  // ---- Simulation fallback ----
  const startSimulation = useCallback(() => {
    const offsetLat = (Math.random() - 0.5) * 0.04;
    const offsetLng = (Math.random() - 0.5) * 0.04;
    const startLat = customerLoc.lat + offsetLat;
    const startLng = customerLoc.lng + offsetLng;

    setProviderLoc({
      lat: startLat,
      lng: startLng,
      heading: Math.random() * 360,
      speed: 25 + Math.random() * 15,
      updatedAt: new Date(),
    });
    setTrail([[startLat, startLng]]);

    simulationRef.current = setInterval(() => {
      setProviderLoc((prev) => {
        if (!prev) return prev;
        const dist = haversineDistance(
          prev.lat,
          prev.lng,
          customerLoc.lat,
          customerLoc.lng,
        );

        if (dist < 0.05) {
          if (simulationRef.current) clearInterval(simulationRef.current);
          setCurrentStepIdx(2);
          return { ...prev, speed: 0, updatedAt: new Date() };
        }

        const stepSize = 0.0003 + Math.random() * 0.0002;
        const dlat = customerLoc.lat - prev.lat;
        const dlng = customerLoc.lng - prev.lng;
        const angle = Math.atan2(dlng, dlat);
        const jitter = (Math.random() - 0.5) * 0.3;

        const newLat = prev.lat + Math.cos(angle + jitter) * stepSize;
        const newLng = prev.lng + Math.sin(angle + jitter) * stepSize;
        const heading = ((angle + jitter) * 180) / Math.PI;

        setTrail((t) => [...t.slice(-100), [newLat, newLng]]);

        return {
          lat: newLat,
          lng: newLng,
          heading: heading < 0 ? heading + 360 : heading,
          speed: 20 + Math.random() * 20,
          updatedAt: new Date(),
        };
      });
    }, 2000);
  }, [customerLoc.lat, customerLoc.lng]);

  // ---- Socket.io Realtime Tracking ----
  useEffect(() => {
    if (!booking) return;

    const trackable = [BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS];
    if (!trackable.includes(booking.status)) return;

    const bookingId = Number(id);
    const socket = getTrackingSocket();

    socket.connect();
    socket.emit("subscribeTracking", { bookingId });

    const fallbackTimer = setTimeout(() => {
      if (!socketConnectedRef.current) {
        startSimulation();
      }
    }, 5000);

    const handleLastKnown = (data: { bookingId: number; location: any }) => {
      if (data.location) {
        socketConnectedRef.current = true;
        const loc = data.location;
        setProviderLoc({
          lat: loc.lat,
          lng: loc.lng,
          heading: loc.heading || 0,
          speed: loc.speed || 0,
          updatedAt: new Date(loc.updatedAt || Date.now()),
        });
        setTrail([[loc.lat, loc.lng]]);
      }
    };

    const handleProviderLocUpdate = (data: {
      bookingId: number;
      lat: number;
      lng: number;
      heading?: number;
      speed?: number;
      timestamp?: number;
    }) => {
      socketConnectedRef.current = true;
      const newLoc: ProviderLocation = {
        lat: data.lat,
        lng: data.lng,
        heading: data.heading || 0,
        speed: data.speed || 0,
        updatedAt: new Date(data.timestamp || Date.now()),
      };

      setProviderLoc(newLoc);
      setTrail((prev) => [...prev.slice(-100), [data.lat, data.lng]]);

      const dist = haversineDistance(
        data.lat,
        data.lng,
        customerLoc.lat,
        customerLoc.lng,
      );
      if (dist < 0.05) {
        setCurrentStepIdx(2);
      }
    };

    const handleTrackingEndedUpdate = () => {
      setTrackingEnded(true);
    };

    socket.on("lastKnownLocation", handleLastKnown);
    socket.on("providerLocation", handleProviderLocUpdate);
    socket.on("trackingEnded", handleTrackingEndedUpdate);

    return () => {
      clearTimeout(fallbackTimer);
      socket.emit("unsubscribeTracking", { bookingId });
      socket.off("lastKnownLocation", handleLastKnown);
      socket.off("providerLocation", handleProviderLocUpdate);
      socket.off("trackingEnded", handleTrackingEndedUpdate);
      socket.disconnect();
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, [booking?.status, id, customerLoc.lat, customerLoc.lng, startSimulation]);

  const distance = providerLoc
    ? haversineDistance(
        providerLoc.lat,
        providerLoc.lng,
        customerLoc.lat,
        customerLoc.lng,
      )
    : null;

  const eta =
    distance !== null && providerLoc
      ? formatETA(distance, providerLoc.speed)
      : "—";

  const trackableStatuses = [
    BookingStatus.CONFIRMED,
    BookingStatus.IN_PROGRESS,
  ];
  const isTrackable = booking ? trackableStatuses.includes(booking.status) : false;

  return {
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
  };
}

