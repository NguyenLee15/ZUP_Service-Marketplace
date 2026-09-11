"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bot,
  Check,
  ChevronRight,
  ShieldCheck,
  Star,
  User,
  Wrench,
} from "lucide-react";
import {
  type AssistantAction,
  type ChatbotMessageMeta,
  type ChatbotUIMessage,
  getMessageText,
} from "./types";
import { ChatMarkdown } from "./ChatMarkdown";

interface ChatMessageItemProps {
  message: ChatbotUIMessage;
  meta: ChatbotMessageMeta;
  accessToken: string | null;
  isLoading: boolean;
  onSendMessage: (text: string) => void;
  onConfirmAction: (action: AssistantAction) => void;
  onCloseWidget: () => void;
}

export function ChatMessageItem({
  message,
  meta,
  accessToken,
  isLoading,
  onSendMessage,
  onConfirmAction,
  onCloseWidget,
}: ChatMessageItemProps) {
  const router = useRouter();
  const text = getMessageText(message);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(price || 0));

  return (
    <div
      className={`flex gap-2 ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      {message.role === "assistant" && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <Bot className="h-3.5 w-3.5" />
        </div>
      )}

      <div className="max-w-[84%] space-y-2">
        {text && (
          <div
            className={`whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
              message.role === "user"
                ? "rounded-tr-md bg-blue-600 text-white"
                : "rounded-tl-md border border-slate-200 bg-white text-slate-800"
            }`}
          >
            {message.role === "assistant" ? (
              <ChatMarkdown content={text} />
            ) : (
              text
            )}
          </div>
        )}

        {meta.services && meta.services.length > 0 && (
          <div className="space-y-2">
            {meta.services.map((service) => (
              <div
                key={service.id}
                onClick={() => router.push(`/services/${service.id}`)}
                className="group block cursor-pointer rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-[border-color,box-shadow] hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className="flex gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-slate-500">
                    {service.imageUrl ? (
                      <img
                        src={service.imageUrl}
                        alt={service.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Wrench className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-semibold text-slate-950 group-hover:text-blue-700">
                        {service.name}
                      </p>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                      <span className="truncate max-w-[120px]">
                        {service.categoryName}
                      </span>
                      <span>·</span>
                      <Link
                        href={`/providers/${service.providerId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="truncate max-w-[120px] hover:text-blue-700 hover:underline transition-colors font-medium text-slate-600"
                      >
                        {service.providerName}
                      </Link>
                      {service.distanceKm !== undefined && (
                        <>
                          <span>·</span>
                          <span
                            className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium border shrink-0 ${
                              service.distanceKm < 3
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : service.distanceKm <= 8
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {service.distanceKm.toFixed(1)} km
                          </span>
                        </>
                      )}
                    </div>
                    {service.providerAddress && (
                      <p className="mt-1 line-clamp-1 text-[11px] text-slate-400">
                        Địa chỉ: {service.providerAddress}
                      </p>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-blue-700">
                        {formatPrice(service.referencePrice)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                        <Star className="h-3.5 w-3.5 fill-current" />
                        {Number(service.avgRating || 0).toFixed(1)}
                        <span className="text-slate-400">
                          ({service.totalReviews || 0})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {meta.action && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950 shadow-sm">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
              <div className="min-w-0">
                <p className="font-semibold">{meta.action.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-blue-800">
                  {meta.action.summary}
                </p>
              </div>
            </div>
            {meta.action.type === "CREATE_BOOKING_DRAFT" &&
              !(meta.action.payload as Record<string, any>)?.draft
                ?.desiredTime && (
                <div className="mt-3 space-y-1 rounded-lg border border-blue-100 bg-white p-2 shadow-sm">
                  <label className="block text-[11px] font-medium text-slate-600">
                    📅 Chọn thời gian mong muốn đặt lịch:
                  </label>
                  <input
                    type="datetime-local"
                    min={(() => {
                      const localDate = new Date(
                        Date.now() + 2 * 60 * 60 * 1000,
                      );
                      const tzOffset = localDate.getTimezoneOffset() * 60000;
                      return new Date(localDate.getTime() - tzOffset)
                        .toISOString()
                        .slice(0, 16);
                    })()}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    onChange={(e) => {
                      if (e.target.value) {
                        const dateObj = new Date(e.target.value);
                        const day = String(dateObj.getDate()).padStart(2, "0");
                        const month = String(dateObj.getMonth() + 1).padStart(
                          2,
                          "0",
                        );
                        const year = dateObj.getFullYear();
                        const hours = String(dateObj.getHours()).padStart(
                          2,
                          "0",
                        );
                        const minutes = String(dateObj.getMinutes()).padStart(
                          2,
                          "0",
                        );
                        onSendMessage(
                          `Tôi muốn đặt vào ngày ${day}/${month}/${year} lúc ${hours}:${minutes}`,
                        );
                      }
                    }}
                  />
                </div>
              )}
            <div className="mt-3 flex flex-wrap gap-2">
              {!accessToken ? (
                <Link
                  href="/login"
                  onClick={onCloseWidget}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Đăng nhập để thực hiện
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : meta.action.requiresConfirmation ? (
                <>
                  <button
                    type="button"
                    onClick={() => onConfirmAction(meta.action!)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Xác nhận
                  </button>
                  <button
                    type="button"
                    onClick={() => onSendMessage("Hủy nháp đặt lịch")}
                    disabled={isLoading}
                    className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
                  >
                    Hủy
                  </button>
                </>
              ) : meta.action.href ? (
                <Link
                  href={meta.action.href}
                  onClick={onCloseWidget}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Mở ngay
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          </div>
        )}

        {meta.quickReplies && meta.quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {meta.quickReplies.map((reply) => (
              <button
                key={`${message.id}-${reply.label}`}
                type="button"
                onClick={() => onSendMessage(reply.message)}
                disabled={isLoading}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-[border-color,color] hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
              >
                {reply.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {message.role === "user" && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
          <User className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
}

