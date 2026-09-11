export interface KycUser {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface KycDetail {
  id: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  cccdFrontUrl?: string | null;
  cccdBackUrl?: string | null;
  portraitUrl?: string | null;
  certificateUrl?: string | null;
  rejectReason?: string | null;
  provider?: KycUser | null;
  reviewer?: KycUser | null;
}

export interface KycDocument {
  label: string;
  url: string;
  icon: string;
}

