import { Role, UserStatus } from '@/types';
import { AdminPermissionValue } from '@/types/admin-permissions';

export interface StaffAccount {
  id: number;
  fullName: string;
  email: string;
  phone?: string | null;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  avatarUrl?: string | null;
  permissions?: AdminPermissionValue[] | string[];
  createdAt: string;
}

export interface StaffPaginationMeta {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface AdminPermissionItem {
  value: AdminPermissionValue | string;
  label: string;
  description?: string;
  group?: string;
}

export interface AdminPermissionGroup {
  group: string;
  permissions: AdminPermissionItem[];
}

export interface StaffFormData {
  fullName: string;
  email: string;
  phone: string;
  password?: string;
}

export interface StaffFormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
}

