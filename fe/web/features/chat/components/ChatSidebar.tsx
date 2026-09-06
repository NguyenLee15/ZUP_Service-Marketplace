'use client';

import React from 'react';
import { Search } from 'lucide-react';
import type { Conversation } from '../types';

interface ChatSidebarProps {
  selectedConversation: number | null;
  setSelectedConversation: (id: number | null) => void;
  conversations: Conversation[];
  filteredConversations: Conversation[];
  conversationError: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  userRole?: string;
}

export function ChatSidebar({
  selectedConversation,
  setSelectedConversation,
  conversations,
  filteredConversations,
  conversationError,
  searchQuery,
  setSearchQuery,
  userRole,
}: ChatSidebarProps) {
  return (
    <div
      className={`${
        selectedConversation ? 'hidden' : 'flex'
      } w-full flex-col bg-card md:flex md:w-80 md:border-r md:border-action-blue/10`}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none focus-visible:ring-0 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversationError ? (
          <div className="p-8 text-center text-sm text-red-600" aria-live="polite">
            {conversationError}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Chưa có tin nhắn nào</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Không tìm thấy cuộc trò chuyện nào
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const currentPartner =
              userRole === 'PROVIDER' ? conversation.customer : conversation.provider;
            const contextName =
              conversation.service?.name ||
              conversation.booking?.service?.name ||
              (conversation.booking
                ? `Đơn #${conversation.booking.bookingCode}`
                : 'Trao đổi dịch vụ');
            return (
              <button
                key={conversation.id}
                onClick={() => setSelectedConversation(conversation.id)}
                className={`w-full p-4 flex items-center gap-3 border-b border-action-blue/5 hover:bg-action-blue/5 transition-all duration-200 text-left ${
                  selectedConversation === conversation.id
                    ? 'bg-action-blue/8 border-l-2 border-l-action-blue'
                    : ''
                }`}
              >
                <div className="relative flex-shrink-0">
                  <img
                    src={
                      currentPartner?.avatarUrl ||
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=' + currentPartner?.id
                    }
                    alt={currentPartner?.fullName}
                    className="w-12 h-12 rounded-full"
                  />
                  {conversation.unreadCount && conversation.unreadCount > 0 ? (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                      {conversation.unreadCount}
                    </div>
                  ) : null}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">
                    {currentPartner?.fullName || 'Khách hàng'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {conversation.lastMessage?.content || 'Chưa có tin nhắn'}
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
  );
}

