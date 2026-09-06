'use client';

import React from 'react';
import { ArrowLeft, Bot, ExternalLink, RotateCcw, Wrench } from 'lucide-react';
import Link from 'next/link';
import type { Conversation, Message } from '../types';

interface ChatMessageListProps {
  selectedChat?: Conversation;
  selectedConversation: number | null;
  setSelectedConversation: (id: number | null) => void;
  partnerAvatar: string;
  partnerName: string;
  isTyping: boolean;
  selectedContext: string;
  selectedService: { id: number; name: string } | null;
  isLoading: boolean;
  messagesError: string;
  messages: Message[];
  userId?: number;
  userRole?: string;
  canRecallMessage: (msg: Message) => boolean;
  handleRecallMessage: (msgId: number) => void;
  setZoomedImage: (url: string | null) => void;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessageList({
  selectedChat,
  selectedConversation,
  setSelectedConversation,
  partnerAvatar,
  partnerName,
  isTyping,
  selectedContext,
  selectedService,
  isLoading,
  messagesError,
  messages,
  userId,
  userRole,
  canRecallMessage,
  handleRecallMessage,
  setZoomedImage,
  messagesContainerRef,
  messagesEndRef,
}: ChatMessageListProps) {
  if (!selectedConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground glass-panel">
        <div className="w-16 h-16 rounded-full bg-action-blue/10 flex items-center justify-center mb-4">
          <Bot className="w-8 h-8 text-action-blue" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Chưa chọn cuộc trò chuyện</h3>
        <p className="text-sm">Vui lòng chọn một cuộc trò chuyện từ danh sách bên trái.</p>
      </div>
    );
  }

  return (
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
          <img src={partnerAvatar} alt={partnerName} className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-medium text-foreground">{partnerName}</p>
            {isTyping ? (
              <p className="text-green-600 text-xs italic">Đang gõ…</p>
            ) : (
              <p className="text-muted-foreground text-xs">{selectedContext}</p>
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
                  {userRole === 'PROVIDER'
                    ? 'Khách đang hỏi về dịch vụ'
                    : 'Bạn đang trao đổi về dịch vụ'}
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
          <div className="text-center text-muted-foreground">Đang tải tin nhắn…</div>
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
            <p className="mt-1 text-sm">Gửi lời nhắn đầu tiên để trao đổi trực tiếp với thợ.</p>
          </div>
        ) : (
          messages.map((message) => {
            const isMe = message.senderId === userId;
            const isAi = message.senderType === 'AI' || message.isAiGenerated;
            const isRecalled = Boolean(message.recalledAt);

            return (
              <div
                key={message.id}
                className={`group flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}
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
                      <span className="text-xs font-semibold tracking-wide">AI</span>
                    </div>
                  )}
                  <div
                    className={`relative group inline-block max-w-full px-4 py-2.5 shadow-sm ${
                      isRecalled
                        ? 'border border-dashed border-platinum-tint bg-card/70 text-muted-foreground italic rounded-2xl'
                        : isMe
                        ? 'bg-gradient-to-r from-action-blue to-glacier-blue text-white rounded-2xl rounded-tr-sm'
                        : isAi
                        ? 'bg-[#ECFDF5] border border-[#BBF7D0] text-emerald-950 rounded-2xl rounded-tl-sm'
                        : 'bg-surface border border-outline-variant text-foreground rounded-2xl rounded-tl-sm'
                    }`}
                  >
                    {message.imageUrl && !isRecalled && (
                      <div className="mb-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={message.imageUrl}
                          alt="Chat image"
                          className="max-w-[200px] max-h-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setZoomedImage(message.imageUrl || null)}
                        />
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                      {message.content}
                    </p>
                    <p
                      className={`text-[10px] mt-1 text-right ${
                        !isRecalled && (isMe || isAi) ? 'text-white/70' : 'text-muted-foreground'
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </>
  );
}

