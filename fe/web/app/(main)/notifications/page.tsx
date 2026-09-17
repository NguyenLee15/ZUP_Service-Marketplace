"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Trash2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { notificationsApi } from "@/features/auth/services/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNotificationStore } from "@/store/notification.store";
import { CustomerPageHeader } from "@/components/customer/CustomerPageHeader";

type CustomerNotification = {
  id: number;
  type?: string;
  title: string;
  content: string;
  referenceId?: number | string | null;
  isRead: boolean;
  createdAt: string;
};

const getNotificationHref = (notification: CustomerNotification) => {
  const referenceId = Number(notification.referenceId);

  if (!Number.isFinite(referenceId) || referenceId <= 0) {
    return "";
  }

  const type = String(notification.type || "").toUpperCase();

  if (
    ["BOOKING", "QUOTE", "WORK", "SURVEYOR", "SLA"].some((keyword) =>
      type.includes(keyword),
    )
  ) {
    return `/bookings/${referenceId}`;
  }

  if (type.includes("SERVICE")) {
    return `/services/${referenceId}`;
  }

  return "";
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<CustomerNotification[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">(
    "all",
  );
  const [typeFilter, setTypeFilter] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, [readFilter, typeFilter]);

  const fetchNotifications = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await notificationsApi.getAll({
        isRead: readFilter === "all" ? undefined : readFilter === "read",
        type: typeFilter.trim() || undefined,
      });
      const items = res.data.data || [];
      setNotifications(items);
      useNotificationStore.getState().setNotifications(items);
    } catch (error: unknown) {
      const status =
        typeof error === "object" && error !== null
          ? (error as {
              response?: { status?: number };
              status?: number;
            })
          : undefined;

      if (status?.response?.status === 401 || status?.status === 401) {
        // Token hết hạn hoặc user bị xóa do seed DB, tự động logout
        const { useAuthStore } = await import("@/store/auth.store");
        useAuthStore.getState().logout();
        router.push("/login");
      } else {
        setErrorMessage("Không thể tải danh sách thông báo. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      useNotificationStore.getState().markRead(id);
    } catch (error) {
      console.error("Failed to mark read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      useNotificationStore.getState().markAllRead();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    try {
      setDeletingId(id);
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      useNotificationStore.getState().removeNotification(id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CustomerPageHeader
          eyebrow="Tài khoản"
          title="Thông báo của bạn"
          description="Cập nhật tiến độ đơn hàng, báo giá và tin nhắn từ thợ."
        />

        {notifications.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2 self-start sm:self-auto rounded-xl border-border hover:bg-muted font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            Đánh dấu đã đọc tất cả
          </Button>
        )}
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800/60 p-4 text-rose-800 dark:text-rose-200"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            className="shrink-0 border-rose-300 text-rose-900 hover:bg-rose-100 dark:border-rose-700 dark:text-rose-200 dark:hover:bg-rose-900/50"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Thử lại
          </Button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "Tất cả" },
            { id: "unread", label: "Chưa đọc" },
            { id: "read", label: "Đã đọc" },
          ].map((item) => (
            <Button
              key={item.id}
              size="sm"
              variant={readFilter === item.id ? "default" : "outline"}
              onClick={() => setReadFilter(item.id as "all" | "unread" | "read")}
              className={`rounded-xl px-4 text-xs font-semibold ${
                readFilter === item.id
                  ? "bg-sky-600 hover:bg-sky-500 text-white"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <input
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          placeholder="Lọc theo loại (vd: BOOKING)"
          aria-label="Lọc theo loại thông báo"
          className="h-9 rounded-xl border border-border bg-card px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-sky-500 focus:ring-1 focus:ring-sky-500 sm:w-64"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-2xl border border-border bg-card/60 animate-pulse"
            />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="rounded-2xl p-12 text-center border-dashed border-border bg-card/60 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400 rounded-full flex items-center justify-center mb-4 border border-sky-200/40">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">
            Chưa có thông báo nào
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Bạn sẽ nhận được thông báo khi có cập nhật mới về đơn hàng hoặc các chương trình ưu đãi.
          </p>
          <Link href="/services" className="mt-5">
            <Button className="rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-xs">
              Khám phá dịch vụ ngay
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const detailHref = getNotificationHref(notification);

            return (
              <div
                key={notification.id}
                role="button"
                tabIndex={0}
                aria-label={`Thông báo: ${notification.title}`}
                onClick={() =>
                  !notification.isRead && handleMarkAsRead(notification.id)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!notification.isRead) handleMarkAsRead(notification.id);
                    if (detailHref) router.push(detailHref);
                  }
                }}
                className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  notification.isRead
                    ? "bg-card border-border/80 hover:border-border opacity-85"
                    : "bg-sky-50/40 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800/60 shadow-xs hover:border-sky-400 dark:hover:border-sky-700"
                }`}
              >
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0">
                    {notification.isRead ? (
                      <Circle className="w-3 h-3 text-slate-300 fill-slate-300 dark:text-slate-700 dark:fill-slate-700" />
                    ) : (
                      <Circle className="w-3 h-3 text-sky-600 fill-sky-600 dark:text-sky-400 dark:fill-sky-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <h4
                        className={`font-semibold text-base ${
                          notification.isRead ? "text-muted-foreground" : "text-foreground font-bold"
                        }`}
                      >
                        {notification.title}
                      </h4>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>

                    <p
                      className={`text-sm leading-relaxed ${
                        notification.isRead ? "text-muted-foreground" : "text-foreground/90"
                      }`}
                    >
                      {notification.content}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {detailHref && (
                        <Button
                          type="button"
                          variant="link"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!notification.isRead) {
                              void handleMarkAsRead(notification.id);
                            }
                            router.push(detailHref);
                          }}
                          className="p-0 h-auto text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-semibold text-sm"
                        >
                          Xem chi tiết <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={deletingId === notification.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDeleteNotification(notification.id);
                        }}
                        className="h-auto p-0 text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-transparent hover:text-rose-700 dark:hover:text-rose-300"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Xóa
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
