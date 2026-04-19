'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Send,
  MessageSquare,
  Phone,
  Info,
  Search,
  Plus,
  Bot,
  Paperclip,
} from 'lucide-react'

interface Message {
  id: string
  sender: 'user' | 'provider' | 'ai'
  text: string
  timestamp: Date
  avatar?: string
  isAI?: boolean
}

interface Conversation {
  id: string
  name: string
  avatar: string
  status: 'online' | 'offline'
  isAI?: boolean
  lastMessage?: string
}

const conversations: Conversation[] = [
  {
    id: 'ai',
    name: 'Hỗ Trợ AI',
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai',
    status: 'online',
    isAI: true,
    lastMessage: 'Bạn cần giúp gì?',
  },
  {
    id: 'provider1',
    name: 'Minh Đức Mobile',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider1',
    status: 'online',
    lastMessage: 'Mình sẽ đến khảo sát vào chiều mai',
  },
  {
    id: 'provider2',
    name: 'Clean House Pro',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider2',
    status: 'offline',
    lastMessage: 'Bạn có thêm yêu cầu gì không?',
  },
]

const aiMessages: Message[] = [
  {
    id: '1',
    sender: 'ai',
    text: 'Xin chào! 👋 Tôi là trợ lý AI của ServiceHub. Tôi có thể giúp bạn:',
    timestamp: new Date(Date.now() - 5 * 60000),
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai',
    isAI: true,
  },
  {
    id: '2',
    sender: 'ai',
    text: '• Tìm kiếm dịch vụ phù hợp với nhu cầu của bạn\n• Giải đáp các câu hỏi về dịch vụ\n• Hỗ trợ với các đơn hàng của bạn\n• Cung cấp mẹo và lời khuyên',
    timestamp: new Date(Date.now() - 4 * 60000),
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai',
    isAI: true,
  },
  {
    id: '3',
    sender: 'user',
    text: 'Bạn có thể giúp tôi tìm dịch vụ vệ sinh nhà ở Hà Nội không?',
    timestamp: new Date(Date.now() - 3 * 60000),
  },
  {
    id: '4',
    sender: 'ai',
    text: 'Tất nhiên! Tôi có thể giúp bạn. Tôi tìm thấy 24 dịch vụ vệ sinh nhà ở Hà Nội. Một số dịch vụ hàng đầu:\n\n1. **Clean House Pro** - 4.8⭐ (512 đánh giá) - 500,000₫\n2. **Sparkle Clean** - 4.7⭐ (389 đánh giá) - 450,000₫\n3. **Fresh Home** - 4.6⭐ (267 đánh giá) - 400,000₫\n\nBạn có quan tâm đến bất kỳ dịch vụ nào không?',
    timestamp: new Date(Date.now() - 2 * 60000),
    avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ai',
    isAI: true,
  },
]

export default function ChatPage() {
  const [selectedConversation, setSelectedConversation] = useState<string>('ai')
  const [messages, setMessages] = useState<Message[]>(aiMessages)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: Message = {
      id: String(Date.now()),
      sender: 'user',
      text: inputValue,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: String(Date.now()),
        sender: selectedConversation === 'ai' ? 'ai' : 'provider',
        text: 'Cảm ơn bạn! Tôi sẽ xử lý yêu cầu của bạn trong giây lát.',
        timestamp: new Date(),
        avatar:
          selectedConversation === 'ai'
            ? 'https://api.dicebear.com/7.x/bottts/svg?seed=ai'
            : 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider1',
        isAI: selectedConversation === 'ai',
      }
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 500)
  }

  const selectedChat = conversations.find(c => c.id === selectedConversation)

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-80 bg-white border-r border-gray-200 flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 mb-4">Tin Nhắn</h1>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Tìm cuộc trò chuyện..."
              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-200">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            Cuộc Trò Chuyện Mới
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conversation => (
            <button
              key={conversation.id}
              onClick={() => setSelectedConversation(conversation.id)}
              className={`w-full p-4 flex items-center gap-3 border-b border-gray-200 hover:bg-gray-50 transition text-left ${
                selectedConversation === conversation.id ? 'bg-blue-50' : ''
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img
                  src={conversation.avatar}
                  alt={conversation.name}
                  className="w-12 h-12 rounded-full"
                />
                {conversation.isAI && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1.5">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                )}
                {!conversation.isAI && (
                  <div
                    className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                      conversation.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  ></div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">{conversation.name}</p>
                <p className="text-xs text-gray-500 truncate">{conversation.lastMessage}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedChat && (
              <>
                <img
                  src={selectedChat.avatar}
                  alt={selectedChat.name}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">{selectedChat.name}</p>
                  <p className={`text-xs ${
                    selectedChat.status === 'online' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {selectedChat.status === 'online' ? '🟢 Online' : '⚫ Offline'}
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <Info className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for provider/AI */}
              {message.sender !== 'user' && (
                <img
                  src={message.avatar}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full flex-shrink-0"
                />
              )}

              {/* Message Bubble */}
              <div
                className={`max-w-xs md:max-w-md px-4 py-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : message.sender === 'ai'
                    ? 'bg-purple-100 text-gray-900 rounded-bl-none border border-purple-300'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender === 'user'
                      ? 'text-blue-100'
                      : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <img
                src="https://api.dicebear.com/7.x/bottts/svg?seed=ai"
                alt="Avatar"
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className="bg-gray-100 text-gray-900 rounded-lg rounded-bl-none px-4 py-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-4 md:px-6 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900 flex-shrink-0"
            >
              <Paperclip className="w-5 h-5" />
            </Button>

            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />

            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white flex-shrink-0"
              size="sm"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
