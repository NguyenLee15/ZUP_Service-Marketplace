'use client';

import { Suspense } from 'react';
import { Bot } from 'lucide-react';
import { useChatFlow } from '@/features/chat/hooks/useChatFlow';
import { ChatSidebar } from '@/features/chat/components/ChatSidebar';
import { ChatMessageList } from '@/features/chat/components/ChatMessageList';
import { ChatInputArea } from '@/features/chat/components/ChatInputArea';
import { ChatImageZoomDialog } from '@/features/chat/components/ChatImageZoomDialog';

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100dvh-9rem)] min-h-[620px] items-center justify-center rounded-2xl border border-border bg-card text-sm font-semibold text-muted-foreground">
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
  const {
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
  } = useChatFlow();

  return (
    <div className="flex h-[calc(100dvh-9rem)] min-h-[480px] sm:min-h-[580px] overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      {/* Sidebar */}
      <ChatSidebar
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
        conversations={conversations}
        filteredConversations={filteredConversations}
        conversationError={conversationError}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        userRole={user?.role}
      />

      {/* Main Chat Area */}
      <div
        className={`${
          selectedConversation ? 'flex' : 'hidden'
        } flex-1 flex-col overflow-hidden md:flex`}
      >
        <ChatMessageList
          selectedChat={selectedChat}
          selectedConversation={selectedConversation}
          setSelectedConversation={setSelectedConversation}
          partnerAvatar={partnerAvatar}
          partnerName={partnerName}
          isTyping={isTyping}
          selectedContext={selectedContext}
          selectedService={selectedService}
          isLoading={isLoading}
          messagesError={messagesError}
          messages={messages}
          userId={user?.id}
          userRole={user?.role}
          canRecallMessage={canRecallMessage}
          handleRecallMessage={handleRecallMessage}
          setZoomedImage={setZoomedImage}
          messagesContainerRef={messagesContainerRef}
          messagesEndRef={messagesEndRef}
        />

        {selectedConversation && (
          <ChatInputArea
            selectedFilePreview={selectedFilePreview}
            setSelectedFile={setSelectedFile}
            setSelectedFilePreview={setSelectedFilePreview}
            fileInputRef={fileInputRef}
            handleFileChange={handleFileChange}
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleTypingEvent={handleTypingEvent}
            handleSendMessage={handleSendMessage}
            selectedFile={selectedFile}
          />
        )}
      </div>

      {/* Zoom Image Dialog */}
      <ChatImageZoomDialog zoomedImage={zoomedImage} setZoomedImage={setZoomedImage} />
    </div>
  );
}
