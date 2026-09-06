export const AdminPermission = {
  USER_VIEW: 'user_view',
  USER_LOCK: 'user_lock',
  USER_DELETE: 'user_delete',
  STAFF_VIEW: 'staff_view',
  STAFF_MANAGE: 'staff_manage',
  KYC_VIEW: 'kyc_view',
  KYC_APPROVE: 'kyc_approve',
  KYC_REJECT: 'kyc_reject',
  BOOKING_VIEW: 'booking_view',
  BOOKING_CANCEL: 'booking_cancel',
  DISPUTE_VIEW: 'dispute_view',
  DISPUTE_RESOLVE: 'dispute_resolve',
  SERVICE_MODERATE: 'service_moderate',
  WALLET_DEPOSIT_MANAGE: 'wallet_deposit_manage',
  WALLET_WITHDRAWAL_MANAGE: 'wallet_withdrawal_manage',
  FINANCE_REVENUE: 'finance_revenue',
  FINANCE_COMMISSION: 'finance_commission',
  SETTINGS_MANAGE: 'settings_manage',
  AUDIT_LOG_VIEW: 'audit_log_view',
} as const;

export type AdminPermissionValue =
  (typeof AdminPermission)[keyof typeof AdminPermission];

export const ADMIN_PERMISSION_VALUES = Object.values(AdminPermission);

export type AdminPermissionGroup =
  | 'Người dùng'
  | 'Nhân viên'
  | 'KYC'
  | 'Đơn hàng'
  | 'Khiếu nại'
  | 'Dịch vụ'
  | 'Ví'
  | 'Tài chính'
  | 'Cài đặt & Audit';

export interface AdminPermissionMetadata {
  value: AdminPermissionValue;
  label: string;
  description: string;
  group: AdminPermissionGroup;
}

export interface AdminPermissionGroupMetadata {
  group: AdminPermissionGroup;
  permissions: AdminPermissionMetadata[];
}

export const ADMIN_PERMISSION_METADATA: AdminPermissionMetadata[] = [
  {
    value: AdminPermission.USER_VIEW,
    label: 'Xem người dùng',
    description: 'Xem danh sách và thông tin tài khoản người dùng.',
    group: 'Người dùng',
  },
  {
    value: AdminPermission.USER_LOCK,
    label: 'Khóa/mở khóa người dùng',
    description: 'Khóa hoặc mở khóa tài khoản người dùng.',
    group: 'Người dùng',
  },
  {
    value: AdminPermission.USER_DELETE,
    label: 'Xóa người dùng',
    description: 'Xóa mềm hoặc vô hiệu hóa tài khoản người dùng.',
    group: 'Người dùng',
  },
  {
    value: AdminPermission.STAFF_VIEW,
    label: 'Xem nhân viên',
    description: 'Xem danh sách tài khoản admin và nhân viên.',
    group: 'Nhân viên',
  },
  {
    value: AdminPermission.STAFF_MANAGE,
    label: 'Quản lý nhân viên',
    description: 'Tạo, cập nhật, khóa hoặc xóa tài khoản nhân viên.',
    group: 'Nhân viên',
  },
  {
    value: AdminPermission.KYC_VIEW,
    label: 'Xem KYC',
    description: 'Xem danh sách và chi tiết hồ sơ KYC.',
    group: 'KYC',
  },
  {
    value: AdminPermission.KYC_APPROVE,
    label: 'Duyệt KYC',
    description: 'Phê duyệt hồ sơ KYC của nhà cung cấp.',
    group: 'KYC',
  },
  {
    value: AdminPermission.KYC_REJECT,
    label: 'Từ chối KYC',
    description: 'Từ chối hồ sơ KYC kèm lý do.',
    group: 'KYC',
  },
  {
    value: AdminPermission.BOOKING_VIEW,
    label: 'Xem đơn hàng',
    description: 'Xem danh sách và chi tiết đơn hàng.',
    group: 'Đơn hàng',
  },
  {
    value: AdminPermission.BOOKING_CANCEL,
    label: 'Hủy đơn hàng',
    description: 'Hủy đơn hàng từ trang quản trị.',
    group: 'Đơn hàng',
  },
  {
    value: AdminPermission.DISPUTE_VIEW,
    label: 'Xem khiếu nại',
    description: 'Xem danh sách và chi tiết khiếu nại.',
    group: 'Khiếu nại',
  },
  {
    value: AdminPermission.DISPUTE_RESOLVE,
    label: 'Xử lý khiếu nại',
    description: 'Giải quyết khiếu nại và áp dụng quyết định xử lý.',
    group: 'Khiếu nại',
  },
  {
    value: AdminPermission.SERVICE_MODERATE,
    label: 'Kiểm duyệt dịch vụ',
    description: 'Duyệt, từ chối, ẩn hoặc xóa dịch vụ.',
    group: 'Dịch vụ',
  },
  {
    value: AdminPermission.WALLET_DEPOSIT_MANAGE,
    label: 'Quản lý nạp ví',
    description: 'Xem và xử lý yêu cầu nạp ví thủ công.',
    group: 'Ví',
  },
  {
    value: AdminPermission.WALLET_WITHDRAWAL_MANAGE,
    label: 'Quản lý rút ví',
    description: 'Xem và xử lý yêu cầu rút ví.',
    group: 'Ví',
  },
  {
    value: AdminPermission.FINANCE_REVENUE,
    label: 'Xem doanh thu',
    description: 'Xem dashboard, biểu đồ và báo cáo doanh thu.',
    group: 'Tài chính',
  },
  {
    value: AdminPermission.FINANCE_COMMISSION,
    label: 'Cấu hình hoa hồng',
    description: 'Xem và cập nhật cấu hình hoa hồng.',
    group: 'Tài chính',
  },
  {
    value: AdminPermission.SETTINGS_MANAGE,
    label: 'Quản lý cài đặt',
    description: 'Xem và cập nhật cài đặt hệ thống công khai.',
    group: 'Cài đặt & Audit',
  },
  {
    value: AdminPermission.AUDIT_LOG_VIEW,
    label: 'Xem audit log',
    description: 'Xem và xuất lịch sử thao tác nghiệp vụ, bảo mật.',
    group: 'Cài đặt & Audit',
  },
];

const ADMIN_PERMISSION_GROUP_ORDER: AdminPermissionGroup[] = [
  'Người dùng',
  'Nhân viên',
  'KYC',
  'Đơn hàng',
  'Khiếu nại',
  'Dịch vụ',
  'Ví',
  'Tài chính',
  'Cài đặt & Audit',
];

export const ADMIN_PERMISSION_GROUPS: AdminPermissionGroupMetadata[] =
  ADMIN_PERMISSION_GROUP_ORDER.map((group) => ({
    group,
    permissions: ADMIN_PERMISSION_METADATA.filter(
      (permission) => permission.group === group,
    ),
  }));

