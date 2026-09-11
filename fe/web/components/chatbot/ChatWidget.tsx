"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Bot,
  Check,
  Loader2,
  MessageSquare,
  Pencil,
  Send,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import { chatbotApi } from "@/features/auth/services/api";
import { useAuthStore } from "@/store/auth.store";
import {
  type AssistantAction,
  type ChatbotMessageMeta,
  type ChatbotUIMessage,
  chatbotMessageMetaSchema,
  getMessageText,
} from "./types";
import { ChatMessageItem } from "./ChatMessageItem";

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
  const [metaMap, setMetaMap] = useState<Record<string, ChatbotMessageMeta>>({});
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("Trợ lý AI Zup");
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  const [titleSaving, setTitleSaving] = useState(false);

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
              (session: Record<string, any>) =>
                String(session.id) === String(sessionId),
            )
          : null;
        if (current?.title) {
          setSessionTitle(String(current.title));
        }
      } catch {
        // Title is cosmetic; keep default if session list cannot load
      }
    };

    void fetchSessionTitle();
  }, [sessionId, accessToken]);

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

          const newMetaMap: Record<string, ChatbotMessageMeta> = {};
          historyData.forEach((msg: Record<string, any>) => {
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
    } catch (err: any) {
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
              return (
                <ChatMessageItem
                  key={message.id}
                  message={message}
                  meta={meta}
                  accessToken={accessToken}
                  isLoading={isLoading}
                  onSendMessage={handleSendMessage}
                  onConfirmAction={confirmAction}
                  onCloseWidget={() => setIsOpen(false)}
                />
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
