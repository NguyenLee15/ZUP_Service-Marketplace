"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, Send, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { chatApi } from "@/features/chat/services/chat.api";
import { getChatSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth.store";

interface Message {
  id: string;
  senderId: number | null;
  senderType: "CUSTOMER" | "PROVIDER" | "AI";
  content: string;
  createdAt: string;
  isAiGenerated?: boolean;
}

interface Conversation {
  id: number;
  customer: { id: number; fullName: string; avatarUrl?: string | null };
  provider: { id: number; fullName: string; avatarUrl?: string | null };
  service?: { id: number; name: string } | null;
  booking?: {
    id: number;
    bookingCode: string;
    status: string;
    service?: { id: number; name: string } | null;
  } | null;
  lastMessage?: { content: string; createdAt: string; isAiGenerated: boolean };
  unreadCount?: number;
}

interface IncomingMessage extends Message {
  conversationId: number;
}

interface TypingPayload {
  userId: number;
  conversationId?: number;
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100dvh-9rem)] min-h-[620px] items-center justify-center rounded-[20px] border border-platinum-tint bg-card text-sm font-semibold text-muted-foreground shadow-[var(--brand-shadow-card)]">
          Đang tải tin nhắn...
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}

function ChatPageContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const requestedConversationId = Number(searchParams.get("conversationId") || 0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    number | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationError, setConversationError] = useState("");
  const [messagesError, setMessagesError] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations on load and select the conversation requested by URL.
  useEffect(() => {
    chatApi
      .getConversations()
      .then((res) => {
        const data: Conversation[] = Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        setConversations(data);
        setSelectedConversation((current) => {
          if (requestedConversationId > 0) return requestedConversationId;
          if (current && data.some((conversation) => conversation.id === current)) {
            return current;
          }
          return data[0]?.id ?? null;
        });
        setConversationError("");
      })
      .catch(() => {
        setConversationError(
          "Không thể tải danh sách trò chuyện. Vui lòng thử lại sau.",
        );
      });
  }, [requestedConversationId]);

  // Socket setup
  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) return;

    const handleNewMessage = (msg: IncomingMessage) => {
      if (selectedConversation === msg.conversationId) {
        setMessages((prev) => [...prev, msg]);
        setIsTyping(false);
      }
      // Update conversation list
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === msg.conversationId);
        if (idx > -1) {
          const updated = [...prev];
          updated[idx].lastMessage = {
            content: msg.content,
            createdAt: msg.createdAt,
            isAiGenerated: Boolean(msg.isAiGenerated),
          };
          return updated.sort(
            (a, b) =>
              new Date(b.lastMessage?.createdAt || 0).getTime() -
              new Date(a.lastMessage?.createdAt || 0).getTime(),
          );
        }
        return prev;
      });
    };

    const handleTyping = (data: TypingPayload) => {
      if (
        data.userId !== user?.id &&
        (data.conversationId === undefined ||
          data.conversationId === selectedConversation)
      ) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("typing", handleTyping);
    };
  }, [selectedConversation, user?.id]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;
    setIsLoading(true);
    chatApi
      .getMessages(selectedConversation)
      .then((res) => {
        setMessages(res.data?.data || []);
        setMessagesError("");
      })
      .catch(() => {
        setMessagesError("Không thể tải tin nhắn. Vui lòng thử lại sau.");
      })
      .finally(() => setIsLoading(false));

    const socket = getChatSocket();
    if (socket) {
      if (!socket.connected) socket.connect();
      socket.emit("joinConversation", { conversationId: selectedConversation });
    }
  }, [selectedConversation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !selectedConversation) return;

    const socket = getChatSocket();
    if (socket) {
      if (!socket.connected) socket.connect();
      socket.emit("sendMessage", {
        conversationId: selectedConversation,
        content: inputValue.trim(),
      });
    }
    setInputValue("");
  };

  const handleTypingEvent = () => {
    const socket = getChatSocket();
    if (socket && selectedConversation) {
      socket.emit("typing", { conversationId: selectedConversation });
    }
  };

  const selectedChat = conversations.find((c) => c.id === selectedConversation);
  const partner = selectedChat
    ? user?.role === "PROVIDER"
      ? selectedChat.customer
      : selectedChat.provider
    : null;
  const partnerName =
    partner?.fullName || (user?.role === "PROVIDER" ? "Khách hàng" : "Thợ dịch vụ");
  const partnerAvatar =
    partner?.avatarUrl ||
    "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
      (partner?.id || selectedConversation || "chat");
  const selectedContext =
    selectedChat?.service?.name ||
    selectedChat?.booking?.service?.name ||
    (selectedChat?.booking
      ? `Đơn #${selectedChat.booking.bookingCode}`
      : "Trao đổi dịch vụ");

  return (
    <div className="h-[calc(100dvh-9rem)] min-h-[620px] flex bg-card overflow-hidden rounded-[20px] border border-platinum-tint shadow-[var(--brand-shadow-card)]">
      {/* Sidebar */}
      <div
        className={`${selectedConversation ? "hidden" : "flex"} w-full flex-col bg-white md:flex md:w-80 md:border-r md:border-platinum-tint`}
      >
        <div className="p-4 border-b border-platinum-tint">
          <h1 className="text-xl font-bold text-foreground mb-4">Tin nhắn</h1>
          <div className="flex items-center gap-2 bg-cloud-mist rounded-lg px-3 py-2 border border-platinum-tint">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm cuộc trò chuyện…"
              aria-label="Tìm cuộc trò chuyện"
              name="chat-search"
              autoComplete="off"
              className="flex-1 bg-transparent outline-none focus-visible:ring-2 focus-visible:ring-action-blue rounded text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversationError ? (
            <div
              className="p-8 text-center text-sm text-red-600"
              aria-live="polite"
            >
              {conversationError}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Chưa có tin nhắn nào
            </div>
          ) : (
            conversations.map((conversation) => {
              const currentPartner =
                user?.role === "PROVIDER"
                  ? conversation.customer
                  : conversation.provider;
              const contextName =
                conversation.service?.name ||
                conversation.booking?.service?.name ||
                (conversation.booking
                  ? `Đơn #${conversation.booking.bookingCode}`
                  : "Trao đổi dịch vụ");
              return (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`w-full p-4 flex items-center gap-3 border-b border-platinum-tint hover:bg-pale-gray transition-colors text-left ${
                    selectedConversation === conversation.id
                      ? "bg-pale-gray/70"
                      : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        currentPartner?.avatarUrl ||
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=" +
                          currentPartner?.id
                      }
                      alt={currentPartner?.fullName}
                      className="w-12 h-12 rounded-full"
                    />
                    {conversation.unreadCount &&
                    conversation.unreadCount > 0 ? (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                        {conversation.unreadCount}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">
                      {currentPartner?.fullName || "Khách hàng"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {conversation.lastMessage?.content || "Chưa có tin nhắn"}
                    </p>
                    <p className="text-[10px] text-slate-blue font-medium truncate mt-0.5">
                      {contextName}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div
        className={`${selectedConversation ? "flex" : "hidden"} flex-1 flex-col overflow-hidden md:flex`}
      >
        {selectedConversation ? (
          <>
            <div className="bg-white border-b border-platinum-tint px-4 md:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Quay lại danh sách trò chuyện"
                  onClick={() => setSelectedConversation(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-platinum-tint text-muted-foreground transition-colors hover:bg-pale-gray hover:text-action-blue md:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <img
                  src={partnerAvatar}
                  alt={partnerName}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-foreground">
                    {partnerName}
                  </p>
                  {isTyping ? (
                    <p className="text-green-600 text-xs italic">Đang gõ…</p>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      {selectedContext}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-cloud-mist">
              {isLoading ? (
                <div className="text-center text-muted-foreground">
                  Đang tải tin nhắn…
                </div>
              ) : messagesError ? (
                <div className="text-center text-red-600" aria-live="polite">
                  {messagesError}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-platinum-tint bg-white/70 px-6 text-center text-muted-foreground">
                  <Bot className="mb-3 h-10 w-10 text-steel-gray" />
                  <p className="font-semibold text-foreground">
                    Chưa có tin nhắn trong cuộc trò chuyện này
                  </p>
                  <p className="mt-1 text-sm">
                    Gửi lời nhắn đầu tiên để trao đổi trực tiếp với thợ.
                  </p>
                </div>
              ) : (
                messages.map((message) => {
                  const isMe = message.senderId === user?.id;
                  const isAi =
                    message.senderType === "AI" || message.isAiGenerated;

                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      {!isMe && (
                        <img
                          src={partnerAvatar}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      )}

                      <div
                        className={`max-w-xs md:max-w-md px-4 py-3 rounded-lg ${
                          isMe
                            ? "bg-action-blue text-white rounded-br-none"
                            : isAi
                              ? "bg-midnight-indigo text-white rounded-bl-none shadow-[var(--brand-shadow-sm)]"
                              : "bg-white text-foreground rounded-bl-none border border-platinum-tint"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={`text-[10px] mt-1 text-right ${isMe || isAi ? "text-white/70" : "text-muted-foreground"}`}
                        >
                          {new Date(message.createdAt).toLocaleTimeString(
                            "vi-VN",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t border-platinum-tint px-4 md:px-6 py-4">
              <form
                id="chat-form"
                onSubmit={handleSendMessage}
                className="flex gap-3"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    handleTypingEvent();
                  }}
                  placeholder="Nhập tin nhắn…"
                  aria-label="Nhập tin nhắn"
                  name="message"
                  autoComplete="off"
                  className="flex-1 px-4 py-2 border border-platinum-tint bg-white text-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-action-blue"
                />
                <Button
                  type="submit"
                  aria-label="Gửi tin nhắn"
                  disabled={!inputValue.trim()}
                  className="bg-action-blue hover:bg-glacier-blue text-white rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0"
                >
                  <Send className="w-4 h-4 ml-[-2px]" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/50">
            <Bot className="w-16 h-16 text-steel-gray mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Chưa chọn cuộc trò chuyện
            </h3>
            <p className="text-sm">
              Vui lòng chọn một cuộc trò chuyện từ danh sách bên trái.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
