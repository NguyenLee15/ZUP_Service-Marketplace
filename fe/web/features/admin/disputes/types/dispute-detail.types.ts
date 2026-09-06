export interface DisputeEvidence {
  id?: number;
  fileUrl: string;
  type?: 'IMAGE' | 'VIDEO' | string;
  createdAt?: string;
}

export interface DisputeAttachment {
  id?: number;
  fileUrl: string;
  type?: 'RESULT' | 'BEFORE' | 'AFTER' | string;
  createdAt?: string;
}

export interface DisputeBookingCustomer {
  id: number;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface DisputeBookingProvider {
  id: number;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface DisputeBookingService {
  id: number;
  name: string;
  price?: number;
}

export interface DisputeBookingQuotation {
  id: number;
  actualPrice?: number | string | null;
  commissionRateSnapshot?: number | null;
  status?: string;
}

export interface DisputeBookingInfo {
  id: number;
  bookingCode?: string | null;
  addressDetail?: string | null;
  ward?: string | null;
  district?: string | null;
  province?: string | null;
  customer?: DisputeBookingCustomer | null;
  provider?: DisputeBookingProvider | null;
  service?: DisputeBookingService | null;
  quotation?: DisputeBookingQuotation | null;
  attachments?: DisputeAttachment[];
}

export interface DisputeDetailData {
  id: number;
  bookingId: number;
  reason: string;
  status: 'PENDING' | 'RESOLVED' | string;
  resolutionAction?: 'COMPLETE' | 'PENALIZE' | null;
  resolutionReason?: string | null;
  penaltyAmount?: number | string | null;
  aiSummary?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
  booking?: DisputeBookingInfo | null;
  evidences: DisputeEvidence[];
}

export interface AiParsedSummary {
  confidence: number;
  confidenceLabel: string;
  recommendation: string;
  evidencePoints: { type: 'positive' | 'negative' | 'neutral'; text: string }[];
  anomalies: { type: 'warning' | 'critical'; text: string }[];
  reasoning: string;
  messagesAnalyzed: number;
  imagesAnalyzed: number;
}

