export interface AuditLogActor {
  id?: number;
  email?: string;
  fullName?: string;
  role?: string;
}

export interface AuditLogItem {
  id: number;
  createdAt: string;
  actor?: AuditLogActor | null;
  actorId?: number | null;
  action: string;
  targetType?: string | null;
  targetId?: number | string | null;
  ipAddress?: string | null;
  description?: string | null;
}

export interface AuditFilters {
  keyword: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  from: string;
  to: string;
  page: number;
  limit: number;
}

