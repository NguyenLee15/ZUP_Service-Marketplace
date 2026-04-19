'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Paperclip, AlertTriangle, Clock } from 'lucide-react';

interface Conversation {
  id: string;
  partnerName: string;
  partnerAvatar: string;
  bookingId: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  isAI: boolean;
}

interface Message {
  id: string;
  sender: 'me' | 'them' | 'ai';
  content: string;
  time: string;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    partnerName: 'Nguyễn Văn A',
    partnerAvatar: '👨',
    bookingId: 'BK-12348',
    lastMessage: 'Có thể hoàn thành sớm hơn không?',
    lastTime: '14:32',
    unreadCount: 2,
    isAI: false,
  },
  {
    id: '2',
    partnerName: 'Hỗ Trợ AI',
    partnerAvatar: '🤖',
    bookingId: 'AI-Support',
    lastMessage: 'Bạn có câu hỏi gì tôi có thể giúp?',
    lastTime: '10:15',
    unreadCount: 0,
    isAI: true,
  },
  {
    id: '3',
    partnerName: 'Trần Thị B',
    partnerAvatar: '👩',
    bookingId: 'BK-12347',
    lastMessage: 'Cảm ơn bạn rất nhiều!',
    lastTime: '09:45',
    unreadCount: 0,
    isAI: false,
  },
  {
    id: '4',
    partnerName: 'Lê Văn C',
    partnerAvatar: '👨',
    bookingId: 'BK-12346',
    lastMessage: 'Bạn đã nhận file chưa?',
    lastTime: 'Hôm qua',
    unreadCount: 1,
    isAI: false,
  },
];

const mockMessages: Message[] = [
  { id: '1', sender: 'them', content: 'Xin chào, tôi cần một logo tuyệt vời', time: '14:15' },
  { id: '2', sender: 'me', content: 'Xin chào! Tôi sẵn sàng giúp bạn', time: '14:16' },
  { id: '3', sender: 'them', content: 'Tôi muốn một thiết kế hiện đại với màu xanh', time: '14:18' },
  { id: '4', sender: 'me', content: 'Rất tốt! Tôi sẽ bắt đầu ngay. Dự kiến hoàn thành trong 3-5 ngày', time: '14:20' },
  { id: '5', sender: 'them', content: 'Có thể hoàn thành sớm hơn không?', time: '14:32' },
];

export default function ProviderChat() {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [messages, setMessages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: (messages.length + 1).toString(),
      sender: 'me',
      content: newMessage,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, message]);
    setNewMessage('');

    // Simulate AI/customer reply after a delay
    setTimeout(() => {
      const replies = [
        'Cảm ơn bạn! 👍',
        'Được rồi, tôi chờ bạn',
        'Tuyệt vời, cảm ơn bạn',
        'Bạn làm việc nhanh quá!',
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      setMessages(prev => [...prev, {
        id: (prev.length + 1).toString(),
        sender: 'them',
        content: randomReply,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 1000);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex gap-4">
      {/* Sidebar - Conversations */}
      <div className="w-full md:w-80 bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Tin Nhắn
          </h2>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {mockConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => setSelectedConversation(conv)}
              className={`w-full p-3 border-b border-gray-100 text-left hover:bg-gray-50 transition ${
                selectedConversation.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{conv.partnerAvatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1">
                    <p className="font-medium text-gray-900 text-sm">{conv.partnerName}</p>
                    {conv.isAI && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">AI</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{conv.bookingId}</p>
                  <p className="text-sm text-gray-600 truncate mt-0.5">{conv.lastMessage}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500 whitespace-nowrap">{conv.lastTime}</p>
                  {conv.unreadCount > 0 && (
                    <span className="inline-block bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-1">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main - Chat */}
      <div className="hidden md:flex flex-1 flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{selectedConversation.partnerAvatar}</div>
            <div>
              <p className="font-bold text-gray-900 flex items-center gap-2">
                {selectedConversation.partnerName}
                {selectedConversation.isAI && (
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">AI Assistant</span>
                )}
              </p>
              <p className="text-sm text-gray-600">{selectedConversation.bookingId}</p>
            </div>
          </div>
          {!selectedConversation.isAI && (
            <Button variant="outline" size="sm">
              Xem Booking
            </Button>
          )}
        </div>

        {/* AI Feature Info */}
        {selectedConversation.isAI && (
          <div className="bg-blue-50 border-b border-blue-200 p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              Hỗ trợ AI có thể giúp bạn trả lời câu hỏi phổ biến, quản lý booking, và tối ưu hóa dịch vụ của bạn.
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender === 'me'
                    ? 'bg-blue-600 text-white'
                    : msg.sender === 'ai'
                    ? 'bg-purple-100 text-purple-900'
                    : 'bg-white text-gray-900 border border-gray-200'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.sender === 'me' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {msg.time}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Nhập tin nhắn..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
              className="px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 text-xs">
            <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
              <Paperclip className="w-4 h-4" />
              File
            </button>
            <button className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
              <Clock className="w-4 h-4" />
              Lên Lịch
            </button>
          </div>
        </div>
      </div>

      {/* Mobile placeholder */}
      <div className="md:hidden w-full flex items-center justify-center text-gray-500">
        <p>Chọn một cuộc trò chuyện để bắt đầu</p>
      </div>
    </div>
  );
}
