export interface Message {
  id: number;
  senderId: number | null;
  senderType: 'CUSTOMER' | 'PROVIDER' | 'AI';
  content: string;
  createdAt: string;
  recalledAt?: string | null;
  isAiGenerated?: boolean;
  imageUrl?: string | null;
}

export interface Conversation {
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

export interface IncomingMessage extends Message {
  conversationId: number;
}

export interface TypingPayload {
  userId: number;
  conversationId?: number;
}

