export interface AdminPaginationParams {
  page?: number;
  limit?: number;
  keyword?: string;
  status?: string;
  role?: string;
  [key: string]: unknown;
}

export interface AdminUserItem {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'STAFF';
  status: 'ACTIVE' | 'LOCKED' | 'PENDING';
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
  providerProfile?: {
    bio?: string;
    experienceYears?: number;
    ratingAvg?: number;
    ratingCount?: number;
  };
}

export interface AdminKycItem {
  id: number;
  providerId: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  idCardNumber?: string;
  idCardFrontUrl?: string;
  idCardBackUrl?: string;
  portraitUrl?: string;
  businessLicenseUrl?: string;
  certifications?: string[];
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt?: string;
  provider?: {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
    avatarUrl?: string;
  };
}

export interface AdminWalletDepositItem {
  id: number;
  providerId: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
  code?: string;
  transferContent?: string;
  proofImageUrl?: string;
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
  provider?: {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
  };
  processor?: {
    id: number;
    fullName: string;
  };
}

export interface AdminWalletWithdrawalItem {
  id: number;
  providerId: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  bankCode?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  adminNote?: string;
  createdAt: string;
  processedAt?: string;
  provider?: {
    id: number;
    fullName: string;
    email: string;
    phone?: string;
  };
  processor?: {
    id: number;
    fullName: string;
  };
}

export interface AdminAuditLogItem {
  id: number;
  actorId?: number;
  action: string;
  targetType: string;
  targetId?: number;
  description?: string;
  ipAddress?: string;
  createdAt: string;
  actor?: {
    id: number;
    fullName: string;
    email: string;
    role: string;
  };
}

export interface AdminCommissionSettings {
  rate: number;
  minAmount: number;
  maxAmount: number;
}
