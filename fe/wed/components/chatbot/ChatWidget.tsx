"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  useChat,
} from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Bot,
  CalendarCheck,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  User,
  Wrench,
  X,
} from "lucide-react";
import { z } from "zod/v4";
import api from "@/lib/axios";

const chatServiceSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  referencePrice: z.number(),
  providerId: z.number(),
  providerName: z.string(),
  avgRating: z.number(),
  totalReviews: z.number(),
  categoryName: z.string(),
  imageUrl: z.string().optional(),
});

const quickReplySchema = z.object({
  label: z.string(),
  message: z.string(),
});

const assistantActionSchema = z.object({
  id: z.string(),
  type: z.enum([
    "CREATE_BOOKING_DRAFT",
    "CONFIRM_CREATE_BOOKING",
    "OPEN_PROVIDER_CHAT",
    "VIEW_BOOKING",
    "REBOOK",
    "CANCEL_BOOKING_DRAFT",
  ]),
  label: z.string(),
  summary: z.string(),
  payload: z.record(z.string(), z.unknown()),
  requiresConfirmation: z.boolean(),
  href: z.string().optional(),
});

const chatbotMessageMetaSchema = z.object({
  sessionId: z.string().optional(),
  services: z.array(chatServiceSchema).optional(),
  quickReplies: z.array(quickReplySchema).optional(),
  action: assistantActionSchema.optional(),
});

type AssistantAction = z.infer<typeof assistantActionSchema>;
type ChatbotMessageMeta = z.infer<typeof chatbotMessageMetaSchema>;
type ChatbotUIMessage = UIMessage<ChatbotMessageMeta>;

/** Extract text content from a UIMessage (v6 parts-based) */
function getMessageText(msg: ChatbotUIMessage): string {
  if (msg.parts && msg.parts.length > 0) {
    return msg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  }
  return "";
}

function renderMarkdown(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/** Get auth token from localStorage */
function getAuthToken(): string {
  if (typeof window === "undefined") return "";
  try {
    const store = JSON.parse(
      window.localStorage.getItem("auth-storage") || "{}",
    );
    return store?.state?.accessToken || "";
  } catch {
    return "";
  }
}

export function ChatWidget({ initialOpen = false }: { initialOpen?: boolean }) {
  const pathname = usePathname();
  const hiddenRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [metaMap, setMetaMap] = useState<Record<string, ChatbotMessageMeta>>(
    {},
  );

  const pageContext = useMemo(() => {
    const serviceMatch = pathname?.match(/\/services\/(\d+)/);
    const bookingMatch = pathname?.match(/\/bookings\/(\d+)/);
    return {
      path: pathname || "/",
      serviceId: serviceMatch?.[1],
      bookingId: bookingMatch?.[1],
    };
  }, [pathname]);

  // Khôi phục sessionId từ localStorage
  useEffect(() => {
    const stored = window.localStorage.getItem("chatbot-session-id");
    if (stored) setSessionId(stored);
  }, []);

  useEffect(() => {
    if (sessionId) {
      window.localStorage.setItem("chatbot-session-id", sessionId);
    }
  }, [sessionId]);

  // Tạo transport dùng DefaultChatTransport
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chatbot/stream",
        headers: () => {
          const token = getAuthToken();
          const hdrs: Record<string, string> = {};
          if (token) hdrs["Authorization"] = `Bearer ${token}`;
          return hdrs;
        },
        body: { sessionId, pageContext },
      }),
    [sessionId, pageContext],
  );

  const {
    messages,
    sendMessage,
    setMessages,
    status,
  } = useChat<ChatbotUIMessage>({
    transport,
    messageMetadataSchema: chatbotMessageMetaSchema,
    messages: [
      {
        id: "welcome",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Xin chào, tôi là Customer AI Assistant. Tôi có thể tìm dịch vụ, so sánh lựa chọn, tạo nháp đặt lịch và tra cứu đơn hàng của bạn.",
          },
        ],
      } as ChatbotUIMessage,
    ],
    onFinish: ({ message }) => {
      if (message.metadata?.sessionId) {
        setSessionId(message.metadata.sessionId);
      }
    },
    onError: (err) => {
      console.error("[ChatWidget] useChat error:", err);
    },
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Thiết lập welcome message metadata
  useEffect(() => {
    setMetaMap((prev) => ({
      ...prev,
      welcome: {
        quickReplies: [
          {
            label: "Tìm dịch vụ",
            message: "Máy lạnh chảy nước thì nên chọn dịch vụ nào?",
          },
          {
            label: "So sánh",
            message: "So sánh dịch vụ vệ sinh máy lạnh giúp tôi",
          },
          { label: "Đơn của tôi", message: "Đơn của tôi tới đâu rồi?" },
        ],
      },
    }));
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    const latestSessionId = [...messages]
      .reverse()
      .map((message) => message.metadata?.sessionId)
      .find((value): value is string => Boolean(value));

    if (latestSessionId && latestSessionId !== sessionId) {
      setSessionId(latestSessionId);
    }
  }, [messages, sessionId]);

  if (hiddenRoutes.includes(pathname)) return null;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(price || 0));

  const handleSendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage({ text: trimmed });
  };

  const confirmAction = async (action: AssistantAction) => {
    // Confirmed actions gọi qua API cũ (không stream)
    try {
      const response = await api.post("/chatbot/ask", {
        message: "",
        sessionId,
        pageContext,
        confirmedActionId: action.id,
        history: messages.slice(-8).map((m) => ({
          role: m.role,
          content: getMessageText(m),
        })),
      });
      const data = response.data?.data;
      if (data?.sessionId) setSessionId(data.sessionId);

      const msgId = `confirm-${Date.now()}`;
      setMetaMap((prev) => ({
        ...prev,
        [msgId]: {
          services: data?.services || [],
          quickReplies: data?.quickReplies || [],
          action: data?.action,
        },
      }));

      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          role: "user",
          parts: [{ type: "text", text: action.label }],
        } as ChatbotUIMessage,
        {
          id: msgId,
          role: "assistant",
          parts: [
            { type: "text", text: data?.reply || "Đã xử lý thao tác." },
          ],
        } as ChatbotUIMessage,
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          parts: [
            {
              type: "text",
              text: "Tôi đang gặp lỗi kết nối. Bạn thử lại sau vài giây.",
            },
          ],
        } as ChatbotUIMessage,
      ]);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          id="chat-widget-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Mở trợ lý AI"
          className="fixed bottom-[calc(1rem_+_env(safe-area-inset-bottom))] right-[calc(1rem_+_env(safe-area-inset-right))] z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/25 transition-[background-color,box-shadow,transform] hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {isOpen && (
        <div
          id="chat-widget-modal"
          className="fixed inset-x-3 bottom-[calc(0.75rem_+_env(safe-area-inset-bottom))] z-50 flex h-[min(620px,calc(100dvh_-_1.5rem_-_env(safe-area-inset-bottom)))] w-auto flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[min(420px,calc(100vw_-_2rem))]"
        >
          <div className="border-b border-slate-200 bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-950">
                    Customer AI Assistant
                  </h3>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {isLoading
                      ? "Đang suy nghĩ…"
                      : "Tìm dịch vụ, đặt lịch, tra cứu đơn"}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Đóng trợ lý AI"
                className="rounded-lg p-2 text-slate-500 transition-[background-color,color] hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain bg-slate-50 px-3 py-4" aria-live="polite">
            {messages.map((message) => {
              const streamMeta = message.metadata || {};
              const mapMeta = metaMap[message.id] || {};
              const meta = { ...streamMeta, ...mapMeta };
              const text = getMessageText(message);
              return (
                <div
                  key={message.id}
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
                        {message.role === "assistant"
                          ? renderMarkdown(text)
                          : text}
                      </div>
                    )}

                    {meta.services && meta.services.length > 0 && (
                      <div className="space-y-2">
                        {meta.services.map((service) => (
                          <Link
                            key={service.id}
                            href={`/services/${service.id}`}
                            className="group block rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-[border-color,box-shadow] hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
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
                                <p className="mt-1 truncate text-xs text-slate-500">
                                  {service.categoryName} ·{" "}
                                  {service.providerName}
                                </p>
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
                          </Link>
                        ))}
                      </div>
                    )}

                    {meta.action && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950 shadow-sm">
                        <div className="flex items-start gap-2">
                          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                          <div className="min-w-0">
                            <p className="font-semibold">
                              {meta.action.label}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-blue-800">
                              {meta.action.summary}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {meta.action.requiresConfirmation ? (
                            <>
                              <button
                                type="button"
                                onClick={() => confirmAction(meta.action!)}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Xác nhận
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleSendMessage("Hủy nháp đặt lịch")
                                }
                                disabled={isLoading}
                                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
                              >
                                Hủy
                              </button>
                            </>
                          ) : meta.action.href ? (
                            <Link
                              href={meta.action.href}
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
                            onClick={() => handleSendMessage(reply.message)}
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
            })}

            {isLoading && (
              <div className="flex justify-start gap-2">
                <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-600 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  Đang phân tích dữ liệu thật…
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
            <div className="mb-2 grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  handleSendMessage("Tìm dịch vụ phù hợp cho tôi")
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Tìm
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage(
                    "Tôi muốn đặt lịch dịch vụ này ngày mai lúc 9h",
                  )
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <CalendarCheck className="h-3.5 w-3.5" />
                Đặt
              </button>
              <button
                type="button"
                onClick={() =>
                  handleSendMessage("Đơn của tôi tới đâu rồi?")
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-2 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <Clock className="h-3.5 w-3.5" />
                Đơn
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                name="chatbot-message"
                aria-label="Nhập tin nhắn cho trợ lý AI"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSendMessage(input);
                }}
                placeholder="Nhập nhu cầu, ví dụ: máy lạnh chảy nước…"
                disabled={isLoading}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-3.5 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || isLoading}
                aria-label="Gửi tin nhắn"
                className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
