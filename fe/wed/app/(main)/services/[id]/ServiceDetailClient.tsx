"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Star,
  MessageSquare,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
  Phone,
  Diamond,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "@/components/navigation/BackButton";
import { useToast } from "@/components/ui/use-toast";
import { chatApi } from "@/features/chat/services/chat.api";
import { Scale, CheckCircle2, Award, Clock, BarChart3 } from "lucide-react";
import axios from "axios";

export function ServiceDetailClient({ service }: { service: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuthStore();
  const [currentImage, setCurrentImage] = useState(0);
  const [chatLoading, setChatLoading] = useState(false);
  const [providerStats, setProviderStats] = useState<{
    avgResponseHours: number | null;
    completionRate: number | null;
    totalCompleted: number;
    totalBookings: number;
  } | null>(null);

  useEffect(() => {
    const API = "/api";
    axios
      .get(`${API}/services/${service.id}/provider-stats`)
      .then((res) => setProviderStats(res.data.data))
      .catch(() => {
        /* silent — metrics là phụ, không block trang */
      });
  }, [service.id]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const images = service?.images || [];
  const reviews = service?.reviews || [];

  const handleStartChat = async () => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    if (user?.role !== Role.CUSTOMER) {
      toast({
        title: "Không thể bắt đầu chat",
        description: "Tính năng này dành cho tài khoản khách hàng.",
        variant: "destructive",
      });
      return;
    }

    setChatLoading(true);
    try {
      const res = await chatApi.getOrCreateConversation({
        serviceId: service.id,
      });
      const conversationId = res.data?.data?.id;
      if (!conversationId) throw new Error("Missing conversation id");
      router.push(`/chat?conversationId=${conversationId}`);
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ error?: { message?: string } }>(err)
        ? err.response?.data?.error?.message
        : undefined;
      toast({
        title: "Không thể mở tin nhắn",
        description: message || "Vui lòng thử lại sau.",
        variant: "destructive",
      });
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 animate-in fade-in duration-500">
      {/* Back Button */}
      <BackButton fallbackHref="/services" className="mb-6" />

      {/* Image Gallery */}
      {images.length > 0 ? (
        <div className="relative rounded-[20px] overflow-hidden bg-muted mb-6 border border-platinum-tint shadow-[var(--brand-shadow-card)]">
          <div className="aspect-[16/9]">
            <Image
              src={images[currentImage]?.imageUrl}
              alt={service.name}
              width={800}
              height={450}
              priority
              className="w-full h-full object-cover"
              style={
                { viewTransitionName: `service-image-${service.id}` } as any
              }
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                aria-label="Xem ảnh trước"
                onClick={() =>
                  setCurrentImage((p) => (p === 0 ? images.length - 1 : p - 1))
                }
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-midnight-indigo/55 hover:bg-midnight-indigo/75 rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                aria-label="Xem ảnh tiếp theo"
                onClick={() =>
                  setCurrentImage((p) => (p === images.length - 1 ? 0 : p + 1))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-midnight-indigo/55 hover:bg-midnight-indigo/75 rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_: any, i: number) => (
                  <button
                    key={i}
                    aria-label={`Xem ảnh ${i + 1}`}
                    onClick={() => setCurrentImage(i)}
                    className={`w-2 h-2 rounded-full transition ${i === currentImage ? "bg-white scale-125" : "bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="aspect-[16/9] rounded-[20px] bg-pale-gray flex items-center justify-center text-6xl text-slate-blue mb-6 border border-platinum-tint">
          🔧
        </div>
      )}

      {/* Service Info */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="text-xs">
                {service.category?.name}
              </Badge>
              {Number(service.avgRating || 0) >= 4.8 && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-action-blue text-white text-[10px] font-bold uppercase tracking-widest shadow-[var(--brand-shadow-sm)]">
                  <Diamond className="w-3 h-3" />
                  Elite Partner
                </div>
              )}
            </div>
            <h1
              className="text-2xl font-bold text-foreground"
              style={
                { viewTransitionName: `service-title-${service.id}` } as any
              }
            >
              {service.name}
            </h1>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
              Giá tham khảo
              <Scale className="w-3 h-3 text-emerald-500" />
            </p>
            <div className="flex flex-col items-end">
              <p className="text-2xl font-bold text-action-blue">
                {formatPrice(Number(service.referencePrice))}
              </p>
              <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
                <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">
                  Giá đề xuất
                </span>
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold dark:text-white">
              {Number(service.avgRating || 0).toFixed(1)}
            </span>
            <span className="text-muted-foreground">
              ({service.totalReviews} đánh giá)
            </span>
          </div>
        </div>

        <Separator />

        <div>
          <h2 className="text-lg font-semibold mb-2 text-foreground">
            Mô tả dịch vụ
          </h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {service.description}
          </p>
        </div>

        <Separator />

        {/* Provider Card */}
        <Card className="surface-card rounded-[20px] py-0">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-action-blue flex items-center justify-center text-white text-xl font-bold shrink-0">
              {service.provider?.fullName?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground text-lg">
                  {service.provider?.fullName}
                </h3>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-widest border border-green-200">
                  <Shield className="w-3 h-3" />
                  Đã xác minh
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-pale-gray text-muted-foreground text-[10px] font-bold uppercase tracking-widest border border-platinum-tint">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </div>
                  Trực tuyến
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                {service.provider?.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {isAuthenticated()
                      ? service.provider.phone
                      : service.provider.phone.slice(0, 4) +
                        "****" +
                        service.provider.phone.slice(-2)}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={handleStartChat}
              disabled={chatLoading}
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              {chatLoading ? "Đang mở..." : "Nhắn tin"}
            </Button>
          </CardContent>
        </Card>

        <Separator />

        {/* Thống kê hiệu suất nhà cung cấp — dữ liệu thật từ API */}
        <Card className="surface-card overflow-hidden rounded-[20px] mb-8 py-0">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-1.5 rounded-lg bg-pale-gray text-action-blue">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-lg font-bold text-midnight-indigo">
                Thống kê nhà cung cấp
              </h3>
            </div>

            {providerStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-pale-gray/50 border border-platinum-tint text-center">
                  <div className="flex justify-center mb-2">
                    <Clock className="w-5 h-5 text-action-blue" />
                  </div>
                  <p className="text-2xl font-bold text-action-blue">
                    {providerStats.avgResponseHours !== null
                      ? `~${providerStats.avgResponseHours}h`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-slate-blue font-medium mt-1">
                    Phản hồi TB
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-green-50 border border-green-100 text-center">
                  <div className="flex justify-center mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-700">
                    {providerStats.completionRate !== null
                      ? `${providerStats.completionRate}%`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-green-600/70 font-medium mt-1">
                    Hoàn thành
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-pale-gray/50 border border-platinum-tint text-center">
                  <div className="flex justify-center mb-2">
                    <Award className="w-5 h-5 text-action-blue" />
                  </div>
                  <p className="text-2xl font-bold text-action-blue">
                    {providerStats.totalCompleted}
                  </p>
                  <p className="text-xs text-slate-blue font-medium mt-1">
                    Đơn hoàn thành
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100 text-center">
                  <div className="flex justify-center mb-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">
                    {Number(service.avgRating || 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-yellow-600/70 font-medium mt-1">
                    Đánh giá TB
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-pale-gray/50 border border-platinum-tint text-center animate-pulse"
                  >
                    <div className="w-5 h-5 bg-platinum-tint rounded mx-auto mb-2" />
                    <div className="w-12 h-6 bg-platinum-tint rounded mx-auto mb-1" />
                    <div className="w-16 h-3 bg-platinum-tint rounded mx-auto" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        {/* Reviews */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-foreground">
            Đánh giá ({reviews.length})
          </h2>
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Chưa có đánh giá nào
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review: any) => (
                <div key={review.id} className="flex gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
                    {review.customer?.fullName?.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-foreground">
                        {review.customer?.fullName}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t border-border p-4 z-30">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Giá tham khảo</p>
            <p className="text-lg font-bold text-action-blue">
              {formatPrice(Number(service.referencePrice))}
            </p>
          </div>
          <Button
            onClick={() => {
              if (!isAuthenticated()) {
                router.push("/login");
                return;
              }
              router.push(`/bookings/create?serviceId=${service.id}`);
            }}
            className="h-12 px-8 bg-action-blue hover:bg-glacier-blue text-white font-semibold rounded-xl shadow-[var(--brand-shadow-button)] transition-colors"
          >
            <Calendar className="w-5 h-5 mr-2" /> Đặt lịch ngay
          </Button>
        </div>
      </div>
    </div>
  );
}
