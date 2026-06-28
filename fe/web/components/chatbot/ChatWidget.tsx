"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import {
  Bot,
  Check,
  ChevronRight,
  Loader2,
  MessageSquare,
  Pencil,
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
import { chatbotApi } from "@/features/auth/services/api";
import { useAuthStore } from "@/store/auth.store";

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
  distanceKm: z.number().optional(),
  providerAddress: z.string().optional(),
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

function parseInlineStyles(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-slate-950">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function renderMarkdown(text: string) {
  if (!text) return null;

  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // Bullet lists
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const content = trimmed.substring(2);
          return (
            <div
              key={lineIdx}
              className="flex items-start gap-1.5 pl-1.5 py-0.5 text-sm"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
              <span className="flex-1 text-slate-800">
                {parseInlineStyles(content)}
              </span>
            </div>
          );
        }

        // Numbered lists
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const num = numMatch[1];
          const content = numMatch[2];
          return (
            <div
              key={lineIdx}
              className="flex items-start gap-1.5 pl-1.5 py-0.5 text-sm"
            >
              <span className="font-semibold text-blue-600 shrink-0 text-xs mt-0.5">
                {num}.
              </span>
              <span className="flex-1 text-slate-800">
                {parseInlineStyles(content)}
              </span>
            </div>
          );
        }

        // Standard text lines
        return (
          <p
            key={lineIdx}
            className="text-sm min-h-[1rem] leading-relaxed text-slate-800"
          >
            {parseInlineStyles(line)}
          </p>
        );
      })}
    </div>
  );
}

function getAuthToken(): string {
  return useAuthStore.getState().accessToken || "";
}

export function ChatWidget({ initialOpen = false }: { initialOpen?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
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
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("Trợ lý AI Zup");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [titleSaving, setTitleSaving] = useState(false);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoords(newCoords);
        setIsLocating(false);
        sendMessage({
          text: "📍 Đã chia sẻ vị trí hiện tại của tôi",
        });
      },
      (error) => {
        console.error("Lỗi lấy vị trí:", error);
        setIsLocating(false);
        alert(
          "Không thể lấy vị trí hiện tại. Vui lòng cấp quyền truy cập GPS cho trang web.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

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

  useEffect(() => {
    if (!sessionId || !accessToken) return;

    const fetchSessionTitle = async () => {
      try {
        const response = await api.get("/chatbot/sessions");
        const sessions = response.data?.data;
        const current = Array.isArray(sessions)
          ? sessions.find(
              (session: ApiPayload) => String(session.id) === String(sessionId),
            )
          : null;
        if (current?.title) {
          setSessionTitle(String(current.title));
        }
      } catch {
        // Title is cosmetic; keep the default if session list cannot load.
      }
    };

    void fetchSessionTitle();
  }, [sessionId, accessToken]);

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
        body: {
          sessionId,
          pageContext: {
            ...pageContext,
            latitude: coords?.latitude,
            longitude: coords?.longitude,
          },
        },
      }),
    [sessionId, pageContext, coords],
  );

  const { messages, sendMessage, setMessages, status } =
    useChat<ChatbotUIMessage>({
      transport,
      messageMetadataSchema: chatbotMessageMetaSchema,
      messages: [
        {
          id: "welcome",
          role: "assistant",
          parts: [
            {
              type: "text",
              text: "Xin chào, tôi là Trợ lý AI Zup. Tôi có thể tìm dịch vụ, tạo nháp đặt lịch và tra cứu đơn hàng của bạn.",
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

  // Khôi phục lịch sử chat từ API khi có sessionId và accessToken
  useEffect(() => {
    if (!sessionId || !accessToken || messages.length > 1 || historyLoading)
      return;

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const response = await api.get(
          `/chatbot/history?sessionId=${sessionId}`,
        );
        const historyData = response.data?.data;
        if (Array.isArray(historyData) && historyData.length > 0) {
          setMessages(historyData);

          // Hydrate metaMap
          const newMetaMap: Record<string, ChatbotMessageMeta> = {};
          historyData.forEach((msg: ApiPayload) => {
            if (msg.role === "assistant" && msg.metadata) {
              newMetaMap[msg.id] = msg.metadata;
            }
          });
          setMetaMap((prev) => ({ ...prev, ...newMetaMap }));
        }
      } catch (err) {
        console.error("Failed to fetch chatbot history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchHistory();
  }, [sessionId, accessToken, setMessages, messages.length]);

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

  const startEditingTitle = () => {
    setTitleInput(sessionTitle);
    setEditingTitle(true);
  };

  const saveSessionTitle = async () => {
    const nextTitle = titleInput.trim().slice(0, 120);
    if (!sessionId || !nextTitle) return;
    setTitleSaving(true);
    try {
      await chatbotApi.updateSessionTitle(sessionId, nextTitle);
      setSessionTitle(nextTitle);
      setEditingTitle(false);
    } catch (err) {
      console.error("Failed to update chatbot session title:", err);
    } finally {
      setTitleSaving(false);
    }
  };

  const confirmAction = async (action: AssistantAction) => {
    if (!accessToken) {
      setMessages((prev) => [
        ...prev,
        {
          id: `auth-err-${Date.now()}`,
          role: "assistant",
          parts: [
            {
              type: "text",
              text: "Vui lòng đăng nhập tài khoản khách hàng để thực hiện thao tác này.",
            },
          ],
        } as ChatbotUIMessage,
      ]);
      return;
    }

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

      if (
        data?.action &&
        data.action.requiresConfirmation === false &&
        data.action.href
      ) {
        if (data.action.type === "OPEN_PROVIDER_CHAT") {
          if (
            !data.action.href.startsWith("/chat") ||
            !data.action.href.includes("conversationId=")
          ) {
            throw new Error(
              "Thông tin cuộc trò chuyện không hợp lệ hoặc thiếu conversationId.",
            );
          }
        }
        if (
          data.action.href.startsWith("/chat") ||
          data.action.href.startsWith("/bookings")
        ) {
          setIsOpen(false);
          router.push(data.action.href);
          return;
        }
      }

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
          parts: [{ type: "text", text: data?.reply || "Đã xử lý thao tác." }],
        } as ChatbotUIMessage,
      ]);
    } catch (err: ApiPayload) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Tôi đang gặp lỗi kết nối. Bạn thử lại sau vài giây.";
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          parts: [
            {
              type: "text",
              text: errMsg,
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
                  {editingTitle ? (
                    <div className="flex min-w-0 items-center gap-1">
                      <input
                        value={titleInput}
                        onChange={(event) =>
                          setTitleInput(event.target.value.slice(0, 120))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") void saveSessionTitle();
                          if (event.key === "Escape") setEditingTitle(false);
                        }}
                        autoFocus
                        className="h-7 min-w-0 rounded-md border border-slate-200 px-2 text-sm font-semibold text-slate-950 outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={saveSessionTitle}
                        disabled={titleSaving || !titleInput.trim()}
                        aria-label="Lưu tên phiên chat"
                        className="rounded-md p-1.5 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                      >
                        {titleSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex min-w-0 items-center gap-1">
                      <h3 className="truncate text-sm font-semibold text-slate-950">
                        {sessionTitle}
                      </h3>
                      {sessionId && accessToken && (
                        <button
                          type="button"
                          onClick={startEditingTitle}
                          aria-label="Đổi tên phiên chat"
                          className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
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



          <div
            className="flex-1 space-y-4 overflow-y-auto overscroll-contain bg-slate-50 px-3 py-4"
            aria-live="polite"
          >
            {historyLoading && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-500 font-medium">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                Đang khôi phục lịch sử chat...
              </div>
            )}
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
                          <div
                            key={service.id}
                            onClick={() =>
                              router.push(`/services/${service.id}`)
                            }
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
                          !(meta.action.payload as ApiPayload)?.draft?.desiredTime && (
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
                                  const tzOffset =
                                    localDate.getTimezoneOffset() * 60000;
                                  const localISOTime = new Date(
                                    localDate.getTime() - tzOffset,
                                  )
                                    .toISOString()
                                    .slice(0, 16);
                                  return localISOTime;
                                })()}
                                className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                onChange={(e) => {
                                  if (e.target.value) {
                                    const dateObj = new Date(e.target.value);
                                    const day = String(
                                      dateObj.getDate(),
                                    ).padStart(2, "0");
                                    const month = String(
                                      dateObj.getMonth() + 1,
                                    ).padStart(2, "0");
                                    const year = dateObj.getFullYear();
                                    const hours = String(
                                      dateObj.getHours(),
                                    ).padStart(2, "0");
                                    const minutes = String(
                                      dateObj.getMinutes(),
                                    ).padStart(2, "0");
                                    handleSendMessage(
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
                              onClick={() => setIsOpen(false)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            >
                              Đăng nhập để thực hiện
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                          ) : meta.action.requiresConfirmation ? (
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
                              onClick={() => setIsOpen(false)}
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
                  Đang xử lý...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-slate-200 bg-white p-3">
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
