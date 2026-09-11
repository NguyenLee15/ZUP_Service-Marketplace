import { AdminUserItem } from '../../types/admin.types';

export type AdminUserRoleFilter = 'CUSTOMER' | 'PROVIDER';
export type AdminUserStatusFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'LOCKED';

export interface LockUserFormData {
  reason: string;
  duration?: string;
}

export type { AdminUserItem };

