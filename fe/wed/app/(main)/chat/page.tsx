"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bot, RotateCcw, Send, Search, Wrench, Image as ImageIcon, X, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { chatApi } from "@/features/chat/services/chat.api";
import { getChatSocket } from "@/lib/socket";
import { useAuthStore } from "@/store/auth.store";

interface Message {
  id: number;
  senderId: number | null;
  senderType: "CUSTOMER" | "PROVIDER" | "AI";
  content: string;
  createdAt: string;
  recalledAt?: string | null;
  isAiGenerated?: boolean;
  imageUrl?: string | null;
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
        <div className="flex h-[calc(100dvh-9rem)] min-h-[620px] items-center justify-center rounded-2xl glass-panel text-sm font-semibold text-muted-foreground shadow-[0_0_30px_rgba(0,107,255,0.05)]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-action-blue/10 flex items-center justify-center animate-pulse">
              <Bot className="w-5 h-5 text-action-blue" />
            </div>
            Đang tải tin nhắn…
          </div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}

function ChatPageContent() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedConversationId = Number(searchParams.get("conversationId") || 0);
  const requestedBookingId = Number(searchParams.get("bookingId") || 0);
  const requestedServiceId = Number(searchParams.get("serviceId") || 0);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    number | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationError, setConversationError] = useState("");
  const [messagesError, setMessagesError] = useState("");

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch conversations on load and select the conversation requested by URL.
  useEffect(() => {
    const resolveAndFetch = async () => {
      let resolvedId = requestedConversationId;

      if (requestedBookingId > 0 || requestedServiceId > 0) {
        try {
          const res = await chatApi.getOrCreateConversation({
            bookingId: requestedBookingId > 0 ? requestedBookingId : undefined,
            serviceId: requestedServiceId > 0 ? requestedServiceId : undefined,
          });
          const conversation = res.data?.data?.data || res.data?.data;
          if (conversation?.id) {
            resolvedId = Number(conversation.id);
            // Replace the URL with conversationId to clean up query params
            router.replace(`/chat?conversationId=${resolvedId}`);
          }
        } catch (err) {
          console.error("Failed to get or create conversation:", err);
        }
      }

      try {
        const res = await chatApi.getConversations();
        const data: Conversation[] = Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        setConversations(data);
        setSelectedConversation((current) => {
          if (resolvedId > 0) return resolvedId;
          if (current && data.some((conversation) => conversation.id === current)) {
            return current;
          }
          return data[0]?.id ?? null;
        });
        setConversationError("");
      } catch {
        setConversationError(
          "Không thể tải danh sách trò chuyện. Vui lòng thử lại sau.",
        );
      }
    };

    resolveAndFetch();
  }, [requestedConversationId, requestedBookingId, requestedServiceId, router]);

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

    const handleMessageRecalled = (msg: IncomingMessage) => {
      setMessages((prev) =>
        prev.map((message) => (message.id === msg.id ? msg : message)),
      );
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === msg.conversationId
            ? {
                ...conversation,
                lastMessage: {
                  content: msg.content,
                  createdAt: msg.createdAt,
                  isAiGenerated: Boolean(msg.isAiGenerated),
                },
              }
            : conversation,
        ),
      );
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
    socket.on("messageRecalled", handleMessageRecalled);
    socket.on("typing", handleTyping);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageRecalled", handleMessageRecalled);
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
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: messages.length > 1 ? "smooth" : "auto",
    });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && !selectedFile) || !selectedConversation) return;

    let finalImageUrl = undefined;
    let finalMessageType = "TEXT";
    const currentText = inputValue.trim();
    const currentFile = selectedFile;

    // Reset input immediately for better UX
    setInputValue("");
    setSelectedFile(null);
    if (selectedFilePreview) {
      URL.revokeObjectURL(selectedFilePreview);
      setSelectedFilePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";

    try {
      if (currentFile) {
        const res = await chatApi.uploadChatImage(currentFile);
        if (res.data?.success && res.data?.data?.imageUrl) {
          finalImageUrl = res.data.data.imageUrl;
          finalMessageType = "IMAGE";
        }
      }

      const socket = getChatSocket();
      if (socket) {
        if (!socket.connected) socket.connect();
        socket.emit("sendMessage", {
          conversationId: selectedConversation,
          content: currentText || (currentFile ? "[Hình ảnh]" : ""),
          messageType: finalMessageType,
          imageUrl: finalImageUrl,
        });
      }
    } catch (err) {
      console.error("Lỗi gửi tin nhắn", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Ảnh không được vượt quá 5MB");
        return;
      }
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setSelectedFilePreview(url);
    }
  };

  const handleTypingEvent = () => {
    const socket = getChatSocket();
    if (socket && selectedConversation) {
      socket.emit("typing", { conversationId: selectedConversation });
    }
  };

  const canRecallMessage = (message: Message) => {
    if (message.recalledAt || message.senderId !== user?.id) return false;
    if (message.senderType === "AI") return false;
    return Date.now() - new Date(message.createdAt).getTime() <= 5 * 60 * 1000;
  };

  const handleRecallMessage = async (messageId: number) => {
    try {
      const response = await chatApi.recallMessage(messageId);
      const recalled = response.data?.data;
      if (recalled) {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === messageId ? { ...message, ...recalled } : message,
          ),
        );
      }
    } catch {
      setMessagesError("Không thể thu hồi tin nhắn này.");
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
  const selectedService = selectedChat?.service || selectedChat?.booking?.service || null;

  return (
    <div className="h-[calc(100dvh-9rem)] min-h-[620px] flex bg-card overflow-hidden rounded-2xl glass-panel shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
      {/* Sidebar */}
      <div
        className={`${selectedConversation ? "hidden" : "flex"} w-full flex-col bg-card md:flex md:w-80 md:border-r md:border-action-blue/10`}
      >
        <div className="p-4 border-b border-action-blue/10">
          <h1 className="text-xl font-bold text-foreground mb-4">Tin nhắn</h1>
          <div className="flex items-center gap-2 glass-panel rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm cuộc trò chuyện…"
              aria-label="Tìm cuộc trò chuyện"
              name="chat-search"
              autoComplete="off"
              className="flex-1 bg-transparent outline-none focus-visible:ring-0 text-sm text-foreground placeholder:text-muted-foreground"
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
                  className={`w-full p-4 flex items-center gap-3 border-b border-action-blue/5 hover:bg-action-blue/5 transition-all duration-200 text-left ${
                    selectedConversation === conversation.id
                      ? "bg-action-blue/8 border-l-2 border-l-action-blue"
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
            <div className="bg-card border-b border-action-blue/10 px-4 md:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Quay lại danh sách trò chuyện"
                  onClick={() => setSelectedConversation(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-full glass-panel text-muted-foreground transition-colors hover:bg-action-blue/10 hover:text-action-blue md:hidden"
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

            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-cloud-mist"
            >
              {selectedService && (
                <Link
                  href={`/services/${selectedService.id}`}
                  className="block rounded-2xl border border-action-blue/20 glass-panel p-4 shadow-sm transition-all hover:border-action-blue/40 hover:shadow-md group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-action-blue/10 text-action-blue">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {user?.role === "PROVIDER" ? "Khách đang hỏi về dịch vụ" : "Bạn đang trao đổi về dịch vụ"}
                      </p>
                      <p className="mt-1 truncate text-sm font-bold text-midnight-indigo sm:text-base group-hover:text-action-blue transition-colors">
                        {selectedService.name}
                      </p>
                      {selectedChat?.booking && (
                        <p className="mt-1 text-xs font-medium text-muted-foreground">
                          Đơn #{selectedChat.booking.bookingCode}
                        </p>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-action-blue transition-colors mt-1" />
                  </div>
                </Link>
              )}
              {isLoading ? (
                <div className="text-center text-muted-foreground">
                  Đang tải tin nhắn…
                </div>
              ) : messagesError ? (
                <div className="text-center text-red-600" aria-live="polite">
                  {messagesError}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-action-blue/20 glass-panel px-6 text-center text-muted-foreground">
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
                  const isRecalled = Boolean(message.recalledAt);

                  return (
                    <div
                      key={message.id}
                      className={`group flex gap-3 ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      {isMe && canRecallMessage(message) && (
                        <button
                          type="button"
                          onClick={() => handleRecallMessage(message.id)}
                          aria-label="Thu hồi tin nhắn"
                          title="Thu hồi tin nhắn"
                          className="mt-1 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full glass-panel text-muted-foreground shadow-sm transition-colors hover:border-red-200 hover:text-red-600 group-hover:flex focus-visible:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {!isMe && (
                        <img
                          src={partnerAvatar}
                          alt="Avatar"
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      )}

                      <div className="flex flex-col">
                        {isAi && !isRecalled && (
                          <div className="flex items-center gap-1.5 opacity-80 mb-1.5 ml-1">
                            <Bot className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold tracking-wide">
                              AI
                            </span>
                          </div>
                        )}
                        <div
                          className={`relative group inline-block max-w-full px-4 py-2.5 shadow-sm ${
                            isRecalled
                              ? "border border-dashed border-platinum-tint bg-card/70 text-muted-foreground italic rounded-2xl"
                              : isMe
                                ? "bg-gradient-to-r from-action-blue to-glacier-blue text-white rounded-2xl rounded-tr-sm"
                                : isAi
                                  ? "bg-[#ECFDF5] border border-[#BBF7D0] text-emerald-950 rounded-2xl rounded-tl-sm"
                                  : "bg-surface border border-outline-variant text-foreground rounded-2xl rounded-tl-sm"
                          }`}
                        >
                          {message.imageUrl && !isRecalled && (
                            <div className="mb-2">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img 
                                src={message.imageUrl} 
                                alt="Chat image" 
                                className="max-w-[200px] max-h-[200px] rounded-lg object-cover"
                              />
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                            {message.content}
                          </p>
                          <p
                            className={`text-[10px] mt-1 text-right ${!isRecalled && (isMe || isAi) ? "text-white/70" : "text-muted-foreground"}`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString(
                              "vi-VN",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-card border-t border-action-blue/10 px-4 md:px-6 py-4 flex flex-col">
              {selectedFilePreview && (
                <div className="mb-3 relative inline-block w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedFilePreview} alt="preview" className="h-20 w-auto rounded-lg object-cover border border-outline-variant shadow-sm" />
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      URL.revokeObjectURL(selectedFilePreview);
                      setSelectedFilePreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute -top-2 -right-2 bg-white rounded-full text-red-500 shadow-sm border border-outline-variant hover:bg-gray-100 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <form
                id="chat-form"
                onSubmit={handleSendMessage}
                className="flex gap-3 items-end"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-action-blue hover:bg-action-blue/10"
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
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
                  className="flex-1 px-4 py-2.5 glass-panel text-foreground rounded-full focus:outline-none focus:ring-2 focus:ring-action-blue focus:border-action-blue/30 min-h-[44px]"
                />
                <Button
                  type="submit"
                  aria-label="Gửi tin nhắn"
                  disabled={!inputValue.trim() && !selectedFile}
                  className="bg-gradient-to-r from-action-blue to-glacier-blue hover:from-glacier-blue hover:to-action-blue text-white rounded-full w-11 h-11 p-0 flex items-center justify-center flex-shrink-0 shadow-[0_0_12px_rgba(0,107,255,0.3)] transition-all mb-0"
                >
                  <Send className="w-4 h-4 ml-[-2px]" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground glass-panel">
            <div className="w-16 h-16 rounded-full bg-action-blue/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-action-blue" />
            </div>
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
