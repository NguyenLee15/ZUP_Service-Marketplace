export type ChatbotActionType =
  | 'CREATE_BOOKING_DRAFT'
  | 'CONFIRM_CREATE_BOOKING'
  | 'OPEN_PROVIDER_CHAT'
  | 'VIEW_BOOKING'
  | 'REBOOK'
  | 'CANCEL_BOOKING_DRAFT';

export interface ChatServiceResult {
  id: number;
  name: string;
  description?: string;
  referencePrice: number;
  providerId: number;
  providerName: string;
  avgRating: number;
  totalReviews: number;
  categoryName: string;
  imageUrl?: string;
  distanceKm?: number;
  providerAddress?: string;
}

export interface ChatbotQuickReply {
  label: string;
  message: string;
}

export interface ChatbotCitation {
  type: 'service' | 'booking';
  id: number;
  label: string;
  href?: string;
}

export interface ChatbotAction {
  id: string;
  type: ChatbotActionType;
  label: string;
  summary: string;
  payload: Record<string, unknown>;
  requiresConfirmation: boolean;
  href?: string;
}

export interface ChatbotPageContext {
  path?: string;
  serviceId?: number | string;
  bookingId?: number | string;
  serviceName?: string;
  latitude?: number;
  longitude?: number;
  addressText?: string;
}

export interface ChatbotAskRequest {
  message?: string;
  sessionId?: string;
  history?: Array<{ role: string; content: string }>;
  pageContext?: ChatbotPageContext;
  confirmedActionId?: string;
}

export interface ChatbotStreamResultRequest {
  sessionId?: string;
  userMessage?: string;
  assistantMessage?: string;
  services?: ChatServiceResult[];
  quickReplies?: ChatbotQuickReply[];
  action?: ChatbotAction;
  confidence?: number;
  citations?: ChatbotCitation[];
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  services: ChatServiceResult[];
  quickReplies: ChatbotQuickReply[];
  action?: ChatbotAction;
  confidence: number;
  citations: ChatbotCitation[];
}

export interface ChatbotUiMessage {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{ type: 'text'; text: string }>;
  createdAt: string;
  metadata?: {
    sessionId: string;
    services: ChatServiceResult[];
    action?: ChatbotAction;
    quickReplies: ChatbotQuickReply[];
  };
}
