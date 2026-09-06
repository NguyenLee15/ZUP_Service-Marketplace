'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { Role } from '@/types';
import {
  AdminPermissionValue,
  ADMIN_PERMISSION_METADATA,
} from '@/types/admin-permissions';
import { AdminForbiddenState } from './AdminForbiddenState';

interface AdminPermissionGuardProps {
  permission?: AdminPermissionValue | AdminPermissionValue[];
  adminOnly?: boolean;
  children: React.ReactNode;
}

export function AdminPermissionGuard({
  permission,
  adminOnly = false,
  children,
}: AdminPermissionGuardProps) {
  const { user, _hasHydrated } = useAuthStore();

  if (!_hasHydrated || !user) {
    return null;
  }

  // Quản trị viên tối cao luôn có toàn quyền
  if (user.role === Role.ADMIN) {
    return <>{children}</>;
  }

  // Tính năng dành riêng cho Admin
  if (adminOnly) {
    return (
      <AdminForbiddenState
        requiredPermissionLabel="Quyền Quản trị viên hệ thống (ADMIN)"
      />
    );
  }

  // Nếu là Nhân viên, kiểm tra permissions
  if (user.role === Role.STAFF) {
    if (!permission) {
      return <>{children}</>;
    }

    const requiredList = Array.isArray(permission) ? permission : [permission];
    const userPermissions = (user.permissions as string[]) || [];

    const hasAnyPermission = requiredList.some((p) =>
      userPermissions.includes(p),
    );

    if (hasAnyPermission) {
      return <>{children}</>;
    }

    const label = requiredList
      .map(
        (p) =>
          ADMIN_PERMISSION_METADATA.find((m) => m.value === p)?.label || p,
      )
      .join(' hoặc ');

    return <AdminForbiddenState requiredPermissionLabel={label} />;
  }

  // Khách hàng hoặc Thợ không có quyền vào trang quản trị
  return (
    <AdminForbiddenState
      requiredPermissionLabel="Tài khoản Quản trị viên hoặc Nhân viên"
    />
  );
}

