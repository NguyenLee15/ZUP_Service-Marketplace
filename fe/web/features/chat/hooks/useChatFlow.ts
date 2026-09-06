'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { chatApi } from '@/features/chat/services/chat.api';
import { getChatSocket } from '@/lib/socket';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'sonner';
import type { Conversation, IncomingMessage, Message, TypingPayload } from '../types';

export function useChatFlow() {
  const { user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedConversationId = Number(searchParams.get('conversationId') || 0);
  const requestedBookingId = Number(searchParams.get('bookingId') || 0);
  const requestedServiceId = Number(searchParams.get('serviceId') || 0);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationError, setConversationError] = useState('');
  const [messagesError, setMessagesError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const currentPartner = user?.role === 'PROVIDER' ? c.customer : c.provider;
    const partnerName = currentPartner?.fullName?.toLowerCase() || '';
    const serviceName =
      c.service?.name?.toLowerCase() || c.booking?.service?.name?.toLowerCase() || '';
    const bookingCode = c.booking?.bookingCode?.toLowerCase() || '';
    return (
      partnerName.includes(query) ||
      serviceName.includes(query) ||
      bookingCode.includes(query)
    );
  });

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
            router.replace(`/chat?conversationId=${resolvedId}`);
          }
        } catch (err) {
          console.error('Failed to get or create conversation:', err);
        }
      }

      try {
        const res = await chatApi.getConversations();
        const data: Conversation[] = Array.isArray(res.data?.data) ? res.data.data : [];
        setConversations(data);
        setSelectedConversation((current) => {
          if (resolvedId > 0) return resolvedId;
          if (current && data.some((conversation) => conversation.id === current)) {
            return current;
          }
          return data[0]?.id ?? null;
        });
        setConversationError('');
      } catch {
        setConversationError('Không thể tải danh sách trò chuyện. Vui lòng thử lại sau.');
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
        (data.conversationId === undefined || data.conversationId === selectedConversation)
      ) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messageRecalled', handleMessageRecalled);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messageRecalled', handleMessageRecalled);
      socket.off('typing', handleTyping);
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
        setMessagesError('');
      })
      .catch(() => {
        setMessagesError('Không thể tải tin nhắn. Vui lòng thử lại sau.');
      })
      .finally(() => setIsLoading(false));

    const socket = getChatSocket();
    if (socket) {
      if (!socket.connected) socket.connect();
      socket.emit('joinConversation', { conversationId: selectedConversation });
    }
  }, [selectedConversation]);

  // Scroll to bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: messages.length > 1 ? 'smooth' : 'auto',
    });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && !selectedFile) || !selectedConversation) return;

    let finalImageUrl = undefined;
    let finalMessageType = 'TEXT';
    const currentText = inputValue.trim();
    const currentFile = selectedFile;

    // Reset input immediately for better UX
    setInputValue('');
    setSelectedFile(null);
    if (selectedFilePreview) {
      URL.revokeObjectURL(selectedFilePreview);
      setSelectedFilePreview(null);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';

    try {
      if (currentFile) {
        const res = await chatApi.uploadChatImage(currentFile);
        if (res.data?.success && res.data?.data?.imageUrl) {
          finalImageUrl = res.data.data.imageUrl;
          finalMessageType = 'IMAGE';
        }
      }

      const socket = getChatSocket();
      if (socket) {
        if (!socket.connected) socket.connect();
        socket.emit('sendMessage', {
          conversationId: selectedConversation,
          content: currentText || (currentFile ? '[Hình ảnh]' : ''),
          messageType: finalMessageType,
          imageUrl: finalImageUrl,
        });
      }
    } catch (err) {
      console.error('Lỗi gửi tin nhắn', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ảnh không được vượt quá 5MB');
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
      socket.emit('typing', { conversationId: selectedConversation });
    }
  };

  const canRecallMessage = (message: Message) => {
    if (message.recalledAt || message.senderId !== user?.id) return false;
    if (message.senderType === 'AI') return false;
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
      setMessagesError('Không thể thu hồi tin nhắn này.');
    }
  };

  const selectedChat = conversations.find((c) => c.id === selectedConversation);
  const partner = selectedChat
    ? user?.role === 'PROVIDER'
      ? selectedChat.customer
      : selectedChat.provider
    : null;
  const partnerName =
    partner?.fullName || (user?.role === 'PROVIDER' ? 'Khách hàng' : 'Thợ dịch vụ');
  const partnerAvatar =
    partner?.avatarUrl ||
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' +
      (partner?.id || selectedConversation || 'chat');
  const selectedContext =
    selectedChat?.service?.name ||
    selectedChat?.booking?.service?.name ||
    (selectedChat?.booking
      ? `Đơn #${selectedChat.booking.bookingCode}`
      : 'Trao đổi dịch vụ');
  const selectedService = selectedChat?.service || selectedChat?.booking?.service || null;

  return {
    user,
    conversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    inputValue,
    setInputValue,
    selectedFile,
    setSelectedFile,
    selectedFilePreview,
    setSelectedFilePreview,
    zoomedImage,
    setZoomedImage,
    fileInputRef,
    isLoading,
    isTyping,
    conversationError,
    messagesError,
    searchQuery,
    setSearchQuery,
    filteredConversations,
    messagesContainerRef,
    messagesEndRef,
    handleSendMessage,
    handleFileChange,
    handleTypingEvent,
    canRecallMessage,
    handleRecallMessage,
    selectedChat,
    partnerName,
    partnerAvatar,
    selectedContext,
    selectedService,
  };
}

