import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * @Permissions('permission_name') — Decorator phân quyền chi tiết cho nhân viên STAFF.
 * Dùng kết hợp với PermissionsGuard.
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
