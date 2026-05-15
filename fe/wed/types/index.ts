// ===== Global Enums — khớp với Backend Prisma enums =====

export enum BookingStatus {
  PENDING = 'PENDING',
  QUOTED = 'QUOTED',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  DISPUTED = 'DISPUTED',
  CANCELLED = 'CANCELLED',
}

export enum ServiceStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  HIDDEN = 'HIDDEN',
  REJECTED = 'REJECTED',
}

export enum KycStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  PROVIDER = 'PROVIDER',
  CUSTOMER = 'CUSTOMER',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  PENDING = 'PENDING',
}

export enum WalletTransactionType {
  DEPOSIT = 'DEPOSIT',
  COMMISSION = 'COMMISSION',
}

export enum WalletTransactionStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
}

export enum DisputeStatus {
  PENDING = 'PENDING',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
}

export enum SenderType {
  CUSTOMER = 'CUSTOMER',
  PROVIDER = 'PROVIDER',
  AI = 'AI',
}

// ===== Common Types =====

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  isOnline?: boolean;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  iconUrl?: string;
  level?: number;
  parentId?: number | null;
}

export interface ServiceImage {
  id: number;
  imageUrl: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  referencePrice: string | number;
  status: ServiceStatus;
  avgRating?: string | number;
  totalReviews?: number;
  images?: ServiceImage[];
  category?: Category;
  provider?: User;
  latitude?: string | number;
  longitude?: string | number;
  aiSummary?: string;
  distance?: number;
  availabilityStatus?: 'AVAILABLE_NOW' | 'AVAILABLE_TODAY' | 'BUSY';
}

export interface Booking {
  id: number;
  bookingCode: string;
  status: BookingStatus;
  customerId: number;
  providerId: number;
  serviceId: number;
  createdAt: string;
  service?: Service;
  customer?: User;
  provider?: User;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
