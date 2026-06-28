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
import { useAuthStore } from "@/store/auth.store";

type AdminNotification = {
  id: number;
  type?: string;
  title: string;
  content: string;
  referenceId?: number | string | null;
  isRead: boolean;
  createdAt: string;
};

const getNotificationHref = (notification: AdminNotification) => {
  const referenceId = Number(notification.referenceId);

  if (!Number.isFinite(referenceId) || referenceId <= 0) {
    return "";
  }

  const type = String(notification.type || "").toUpperCase();

  if (type.includes("KYC")) {
    return `/admin/kyc`;
  }
  
  if (type.includes("DISPUTE")) {
    return `/admin/disputes`;
  }
  
  if (type.includes("WITHDRAW")) {
    return `/admin/wallet`;
  }
  
  if (type.includes("PROVIDER") || type.includes("USER")) {
    return `/admin/users`;
  }

  return "";
};

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
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
      setNotifications(res.data.data || []);
    } catch (error: unknown) {
      const status = typeof error === "object" && error !== null
        ? (error as { response?: { status?: number }; status?: number })
        : undefined;

      if (status?.response?.status === 401 || status?.status === 401) {
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
    } catch (error) {
      console.error("Failed to mark read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-6"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-white rounded-xl border border-slate-100 shadow-sm animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" /> Quản lý thông báo
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Cập nhật những thông báo từ hệ thống dành cho Admin
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" /> Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between shadow-sm">
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
            >
              {item.label}
            </Button>
          ))}
        </div>
        <input
          value={typeFilter}
          onChange={(event) => setTypeFilter(event.target.value)}
          placeholder="Lọc theo loại, ví dụ: NEW_KYC"
          className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all sm:w-64"
        />
      </div>

      {notifications.length === 0 ? (
        <Card className="rounded-[20px] p-12 text-center border-dashed flex flex-col items-center justify-center bg-slate-50/50">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
            <Bell className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            Chưa có thông báo nào
          </h3>
          <p className="text-slate-500">
            Bạn sẽ nhận được thông báo khi có yêu cầu KYC mới hoặc các hoạt động hệ thống khác.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => {
            const detailHref = getNotificationHref(notification);

            return (
              <div
                key={notification.id}
                onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer ${
                  notification.isRead
                    ? "bg-slate-50/50 border-slate-100 opacity-80"
                    : "bg-white border-indigo-100 shadow-[0_4px_20px_-4px_rgba(79,70,229,0.1)] hover:border-indigo-300"
                }`}
              >
                <div className="flex gap-4">
                  <div className="mt-1 shrink-0">
                    {notification.isRead ? (
                      <Circle className="w-3 h-3 text-slate-300 fill-slate-200" />
                    ) : (
                      <Circle className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                      <h4
                        className={`font-semibold text-base ${notification.isRead ? "text-slate-600" : "text-slate-900"}`}
                      >
                        {notification.title}
                      </h4>
                      <span className="flex items-center text-xs text-slate-400 shrink-0">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(notification.createdAt)}
                      </span>
                    </div>

                    <p className={`text-sm mb-3 ${notification.isRead ? "text-slate-500" : "text-slate-600"}`}>
                      {notification.content}
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      {detailHref ? (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!notification.isRead) handleMarkAsRead(notification.id);
                            router.push(detailHref);
                          }}
                          className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:underline transition-colors cursor-pointer"
                        >
                          Xem chi tiết <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      ) : (
                        <div />
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50"
                        disabled={deletingId === notification.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
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
