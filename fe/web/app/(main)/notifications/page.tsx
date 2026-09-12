"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { notificationsApi } from "@/features/auth/services/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNotificationStore } from "@/store/notification.store";

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
      console.error("Failed to mark all read:", error);
    }
  };

  const handleDeleteNotification = async (id: number) => {
    setDeletingId(id);
    try {
      await notificationsApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6"></div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-slate-200/80 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="w-6 h-6 text-action-blue" /> Thông báo của bạn
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cập nhật những thông tin mới nhất về dịch vụ và đơn hàng
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="shrink-0 border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { key: "all", label: "Tất cả" },
            { key: "unread", label: "Chưa đọc" },
            { key: "read", label: "Đã đọc" },
          ].map((item) => (
            <Button
              key={item.key}
              type="button"
              variant={readFilter === item.key ? "default" : "outline"}
              size="sm"
              onClick={() => setReadFilter(item.key as typeof readFilter)}
              className={
                readFilter === item.key
                  ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                  : "border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              }
            >
              {item.label}
            </Button>
          ))}
        </div>
        <input
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          placeholder="Lọc theo type, ví dụ BOOKING"
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:border-sky-600/60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 sm:w-64"
        />
      </div>

      {notifications.length === 0 ? (
        <Card className="surface-card rounded-[20px] p-12 text-center border-dashed flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-cyan-400/10 text-cyan-300 rounded-full flex items-center justify-center mb-4 border border-cyan-300/15">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Chưa có thông báo nào
          </h3>
          <p className="text-muted-foreground">
            Bạn sẽ nhận được thông báo khi có cập nhật mới về đơn hàng hoặc tài
            khoản.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const detailHref = getNotificationHref(notification);

            return (
              <div
                key={notification.id}
                onClick={() =>
                  !notification.isRead && handleMarkAsRead(notification.id)
                }
                className={`p-4 md:p-5 rounded-2xl border transition-[background-color,border-color,box-shadow] cursor-pointer ${
                  notification.isRead
                    ? "bg-white border-slate-200 hover:border-slate-300 opacity-80"
                    : "bg-blue-50/40 border-action-blue/30 shadow-sm hover:border-action-blue/50"
                }`}
              >
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0">
                    {notification.isRead ? (
                      <Circle className="w-3 h-3 text-slate-300 fill-slate-300" />
                    ) : (
                      <Circle className="w-3 h-3 text-action-blue fill-action-blue" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <h4
                        className={`font-semibold text-base ${notification.isRead ? "text-slate-700" : "text-foreground font-bold"}`}
                      >
                        {notification.title}
                      </h4>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>

                    <p
                      className={`text-sm leading-relaxed ${notification.isRead ? "text-muted-foreground" : "text-foreground/90"}`}
                    >
                      {notification.content}
                    </p>

                    {detailHref && (
                      <div className="mt-3 flex flex-wrap items-center gap-3">
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
                          className="p-0 h-auto text-cyan-300 hover:text-cyan-100 font-semibold text-sm"
                        >
                          Xem chi tiết <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={deletingId === notification.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteNotification(notification.id);
                          }}
                          className="h-auto p-0 text-sm font-semibold text-red-300 hover:bg-transparent hover:text-red-100"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Xóa
                        </Button>
                      </div>
                    )}
                    {!detailHref && (
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={deletingId === notification.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteNotification(notification.id);
                          }}
                          className="h-auto p-0 text-sm font-semibold text-red-300 hover:bg-transparent hover:text-red-100"
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Xóa
                        </Button>
                      </div>
                    )}
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
