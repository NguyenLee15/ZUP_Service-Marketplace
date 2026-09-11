// ===== Global Enums — khớp với Backend Prisma enums =====

export enum BookingStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
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

export * from './admin-permissions';
import type { AdminPermissionValue } from './admin-permissions';

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
  permissions?: AdminPermissionValue[];
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
  distanceKm?: number;
  providerAddress?: string;
  aiSummary?: string;
  distance?: number;
  availabilityStatus?: 'AVAILABLE_NOW' | 'AVAILABLE_TODAY' | 'BUSY';
}

export interface BookingItem {
  id: number;
  bookingId: number;
  servicePricingRuleId?: number | null;
  itemName: string;
  unit: string;
  quantity: number;
  priceSnapshot: number | string;
  subtotal: number | string;
}

export interface QuotationItem {
  id: number;
  quotationId: number;
  itemName: string;
  unit: string;
  quantity: number;
  unitPrice: number | string;
  subtotal: number | string;
}

export interface Quotation {
  id: number;
  bookingId: number;
  actualPrice: number | string;
  commissionRateSnapshot: number | string;
  estimatedTime: string;
  note?: string | null;
  type: 'ORIGINAL' | 'SUPPLEMENTARY' | string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | string;
  createdAt?: string;
  updatedAt?: string;
  quotationItems?: QuotationItem[];
}

export interface BookingAttachment {
  id: number;
  bookingId: number;
  type: 'SURVEY' | 'RESULT';
  fileUrl: string;
}

export interface BookingStatusHistory {
  id: number;
  bookingId: number;
  fromStatus: string;
  toStatus: string;
  actorId?: number | null;
  reason?: string | null;
  createdAt: string;
}

export interface Dispute {
  id: number;
  bookingId: number;
  raisedBy: number;
  assignedTo?: number | null;
  reason: string;
  status: DisputeStatus;
  resolutionAction?: 'COMPLETE' | 'PENALIZE' | string | null;
  resolutionReason?: string | null;
  createdAt: string;
}

export interface Review {
  id: number;
  bookingId: number;
  customerId: number;
  serviceId: number;
  providerId: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface UserAddress {
  id: number;
  userId: number;
  label?: string | null;
  province: string;
  district: string;
  ward: string;
  addressDetail: string;
  latitude: number | string;
  longitude: number | string;
  isDefault: boolean;
}

export interface Booking {
  id: number;
  bookingCode: string;
  status: BookingStatus;
  customerId: number;
  providerId: number;
  serviceId: number;
  description?: string;
  province?: string;
  district?: string;
  ward?: string;
  addressDetail?: string;
  desiredTime?: string;
  surveyorName?: string | null;
  surveyorPhone?: string | null;
  providerAcceptedAt?: string | null;
  providerArrivedAt?: string | null;
  providerResponseDeadline?: string | null;
  completedAt?: string | null;
  autoCompletedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  service?: Service;
  customer?: User;
  provider?: User;
  bookingItems?: BookingItem[];
  quotations?: Quotation[];
  attachments?: BookingAttachment[];
  statusHistories?: BookingStatusHistory[];
  dispute?: Dispute | null;
  review?: Review | null;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}
