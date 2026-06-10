"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
import { chatApi } from "@/features/chat/services/chat.api";
import { authApi } from "@/features/auth/services/auth.api";
import { Scale, CheckCircle2, Award, Clock, BarChart3, Sparkles } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { getSafeServiceImageSrc } from "@/lib/security/image-sources";

export function ServiceDetailClient({ service }: { service: ApiPayload }) {
  const router = useRouter();
  const { isAuthenticated, user, setUser } = useAuthStore();
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

  const images = (service?.images || []).map((image: ApiPayload) => ({
    ...image,
    imageUrl: getSafeServiceImageSrc(image.imageUrl, service),
  }));
  const reviews = service?.reviews || [];
  const referencePrice = Number(service.referencePrice || 0);
  const estimateLow = referencePrice * 0.9;
  const estimateHigh = referencePrice * 1.1;

  const handleStartChat = async () => {
    if (!isAuthenticated()) {
      router.push(`/login?redirect=/services/${service.id}`);
      return;
    }

    setChatLoading(true);
    try {
      let activeUser = user;
      if (!activeUser) {
        const profileRes = await authApi.getProfile();
        activeUser = profileRes.data?.data;
        if (activeUser) setUser(activeUser);
      }

      if (activeUser?.role !== Role.CUSTOMER) {
        toast.error("Không thể bắt đầu chat", {
          description: "Tính năng này dành cho tài khoản khách hàng.",
        });
        return;
      }

      const res = await chatApi.getOrCreateConversation({
        serviceId: service.id,
      });
      const conversation = res.data?.data?.data || res.data?.data;
      const conversationId = Number(conversation?.id);
      if (!conversationId) throw new Error("Missing conversation id");
      router.push(`/chat?conversationId=${conversationId}`);
    } catch (err: unknown) {
      const message = axios.isAxiosError<{ error?: { message?: string } }>(err)
        ? err.response?.data?.error?.message
        : undefined;
      toast.error("Không thể mở tin nhắn", {
        description: message || "Vui lòng thử lại sau.",
      });
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-44 animate-in fade-in duration-500 sm:pb-40">
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
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                aria-label="Xem ảnh trước"
                onClick={() =>
                  setCurrentImage((p) => (p === 0 ? images.length - 1 : p - 1))
                }
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2 sm:p-2 bg-midnight-indigo/55 hover:bg-midnight-indigo/75 rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                <ChevronLeft className="w-5 h-5 sm:w-5 sm:h-5" />
              </button>
              <button
                aria-label="Xem ảnh tiếp theo"
                onClick={() =>
                  setCurrentImage((p) => (p === images.length - 1 ? 0 : p + 1))
                }
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2 sm:p-2 bg-midnight-indigo/55 hover:bg-midnight-indigo/75 rounded-full text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
              >
                <ChevronRight className="w-5 h-5 sm:w-5 sm:h-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_: ApiPayload, i: number) => (
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
              className="text-xl sm:text-2xl font-bold text-foreground leading-tight"
            >
              {service.name}
            </h1>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
              Giá tham khảo
              <Scale className="w-3 h-3 text-emerald-500" />
            </p>
            <div className="flex flex-col items-end mt-1">
              <p className="text-xl sm:text-2xl font-bold text-action-blue">
                {formatPrice(referencePrice)}
              </p>
              <div className="flex items-center gap-1 mt-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
                <span className="text-[8px] sm:text-[9px] font-bold text-emerald-700 uppercase tracking-widest hidden sm:inline">
                  Giá đề xuất
                </span>
                <span className="text-[8px] font-bold text-emerald-700 uppercase tracking-widest sm:hidden">
                  Đề xuất
                </span>
                <div className="w-1.5 h-1.5 sm:w-1 sm:h-1 rounded-full bg-emerald-500 animate-pulse" />
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

        <Card className="glass-panel rounded-[20px] border-white/10 text-white shadow-[var(--brand-shadow-card)] py-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/15 via-teal-500/5 to-transparent z-0" />
          <CardContent className="relative z-10 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg border border-white/10 bg-white/10 p-1.5">
                <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                Ước tính giá
              </span>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-tight text-white/60">
                  Giá dự kiến trung bình
                </p>
                <p className="mt-1 text-xl font-bold text-white sm:text-2xl">
                  {formatPrice(estimateLow)} - {formatPrice(estimateHigh)}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-[10px] font-bold uppercase tracking-tight text-white/60">
                  Độ tin cậy
                </p>
                <div className="mt-1 flex items-center gap-2 sm:justify-end">
                  <span className="text-xs font-bold sm:text-sm">Cao (89%)</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-4 w-1 rounded-full bg-emerald-400" />
                    ))}
                    <div className="h-4 w-1 rounded-full bg-white/20" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Bảng giá hạng mục chi tiết */}
        {service.items && service.items.length > 0 && (
          <>
            <div>
              <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                <Diamond className="w-4 h-4 text-action-blue fill-action-blue/20" />
                Bảng giá chi tiết từng hạng mục
              </h2>
              <div className="rounded-[16px] border border-white/10 bg-white/5 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-white/10 text-slate-200 border-b border-white/10">
                      <th className="p-3 font-semibold">Tên hạng mục dịch vụ</th>
                      <th className="p-3 font-semibold w-24">Đơn vị</th>
                      <th className="p-3 font-semibold text-right w-32">Đơn giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {service.items.map((item: ApiPayload) => (
                      <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3 text-slate-100 font-medium">{item.name}</td>
                        <td className="p-3 text-slate-300">{item.unit}</td>
                        <td className="p-3 text-action-blue font-bold text-right">
                          {formatPrice(Number(item.price))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Provider Card */}
        <Card className="glass-panel glow-hover rounded-[20px] border-white/10 py-0">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 text-white">
            <div className="flex items-center gap-3">
              {service.provider?.id ? (
                <Link
                  href={`/providers/${service.provider.id}`}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-action-blue flex items-center justify-center text-white text-xl font-bold shrink-0 hover:opacity-90 transition-opacity"
                >
                  {service.provider?.fullName?.charAt(0)}
                </Link>
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-action-blue flex items-center justify-center text-white text-xl font-bold shrink-0">
                  {service.provider?.fullName?.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {service.provider?.id ? (
                    <Link
                      href={`/providers/${service.provider.id}`}
                      className="font-bold text-foreground text-base sm:text-lg hover:text-action-blue hover:underline transition-colors truncate"
                    >
                      {service.provider?.fullName}
                    </Link>
                  ) : (
                    <h3 className="font-bold text-foreground text-base sm:text-lg truncate">
                      {service.provider?.fullName}
                    </h3>
                  )}
                  <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-green-200">
                    <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    Đã xác minh
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1.5">
                  <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-pale-gray text-muted-foreground text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-platinum-tint">
                    <div className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500"></span>
                    </div>
                    Trực tuyến
                  </div>
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
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto sm:ml-auto shrink-0 mt-2 sm:mt-0">
              {service.provider?.id && (
                <Link href={`/providers/${service.provider.id}`} className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-midnight-indigo border-midnight-indigo/20 hover:bg-pale-gray"
                  >
                    Xem hồ sơ
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto bg-action-blue border-action-blue text-white hover:bg-glacier-blue hover:border-glacier-blue"
                onClick={handleStartChat}
                disabled={chatLoading}
              >
                <MessageSquare className="w-4 h-4 mr-1.5" />
                {chatLoading ? "Đang mở…" : "Nhắn tin cho thợ"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Thống kê hiệu suất nhà cung cấp — dữ liệu thật từ API */}
        <Card className="glass-panel glow-hover overflow-hidden rounded-[20px] mb-8 py-0">
          <CardContent className="p-4 sm:p-6 text-white">
            <div className="flex items-center gap-2 mb-4 sm:mb-5">
              <div className="p-1.5 rounded-lg bg-white/5 text-sky-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Thống kê nhà cung cấp
              </h3>
            </div>

            {providerStats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="flex justify-center mb-1 sm:mb-2">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-sky-400">
                    {providerStats.avgResponseHours !== null
                      ? `~${providerStats.avgResponseHours}h`
                      : "N/A"}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">
                    Phản hồi TB
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
                  <div className="flex justify-center mb-1 sm:mb-2">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-green-400">
                    {providerStats.completionRate !== null
                      ? `${providerStats.completionRate}%`
                      : "N/A"}
                  </p>
                  <p className="text-[10px] sm:text-xs text-green-400/80 font-medium mt-1">
                    Hoàn thành
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-white/5 border border-white/5 text-center">
                  <div className="flex justify-center mb-1 sm:mb-2">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-sky-400">
                    {providerStats.totalCompleted}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">
                    Đơn hoàn thành
                  </p>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <div className="flex justify-center mb-1 sm:mb-2">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />
                  </div>
                  <p className="text-lg sm:text-2xl font-bold text-amber-400">
                    {Number(service.avgRating || 0).toFixed(1)}
                  </p>
                  <p className="text-[10px] sm:text-xs text-amber-400/80 font-medium mt-1">
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
              {reviews.map((review: ApiPayload) => (
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
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#070d12]/88 p-3 shadow-[0_-18px_48px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#101827]/92 px-4 py-3 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
          <div className="flex-1">
            <p className="mb-1 text-[10px] font-medium leading-none text-slate-400 sm:text-xs">
              Giá tham khảo
            </p>
            <p className="text-base font-extrabold leading-none text-cyan-300 sm:text-lg">
              {formatPrice(referencePrice)}
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
            className="h-10 shrink-0 rounded-xl bg-[#0B7CFF] px-5 text-sm font-bold text-white shadow-[0_14px_30px_rgba(11,124,255,0.32)] transition-colors hover:bg-[#19B9F3] sm:h-11 sm:px-7 sm:text-base"
          >
            <Calendar className="mr-1.5 h-4 w-4 sm:mr-2 sm:h-5 sm:w-5" />{" "}
            Đặt lịch
          </Button>
        </div>
      </div>
    </div>
  );
}
