import React from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Package,
  Users,
  CheckSquare,
  Users2,
  MessageSquare,
  Settings,
  BookOpen,
  WalletCards,
  ScrollText,
} from "lucide-react";
import {
  AdminPermission,
  AdminPermissionValue,
} from "@/types/admin-permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiredPermissions?: AdminPermissionValue[];
  adminOnly?: boolean;
}

export const ALL_NAV_ITEMS: NavItem[] = [
  {
    label: "Tổng quan",
    href: "/admin/dashboard",
    icon: <LayoutDashboard className="w-5 h-5" />,
    requiredPermissions: [AdminPermission.FINANCE_REVENUE],
  },
  {
    label: "Đơn hàng",
    href: "/admin/bookings",
    icon: <BookOpen className="w-5 h-5" />,
    requiredPermissions: [AdminPermission.BOOKING_VIEW],
  },
  {
    label: "Dịch vụ",
    href: "/admin/services",
    icon: <Package className="w-5 h-5" />,
    requiredPermissions: [AdminPermission.SERVICE_MODERATE],
  },
  {
    label: "Ví",
    href: "/admin/wallet",
    icon: <WalletCards className="w-5 h-5" />,
    requiredPermissions: [
      AdminPermission.WALLET_DEPOSIT_MANAGE,
      AdminPermission.WALLET_WITHDRAWAL_MANAGE,
    ],
  },
  {
    label: "Người dùng",
    href: "/admin/users",
    icon: <Users className="w-5 h-5" />,
    requiredPermissions: [AdminPermission.USER_VIEW],
  },
  {
    label: "Tranh chấp",
    href: "/admin/disputes",
    icon: <MessageSquare className="w-5 h-5" />,
    requiredPermissions: [AdminPermission.DISPUTE_VIEW],
  },
  {
    label: "KYC",
    href: "/admin/kyc",
    icon: <CheckSquare className="w-5 h-5" />,
    requiredPermissions: [AdminPermission.KYC_VIEW],
  },
  {
    label: "Danh mục",
    href: "/admin/categories",
    icon: <FolderOpen className="w-5 h-5" />,
    requiredPermissions: [AdminPermission.SERVICE_MODERATE],
  },
  {
    label: "Nhân viên",
    href: "/admin/staffs",
    icon: <Users2 className="w-5 h-5" />,
    adminOnly: true,
    requiredPermissions: [AdminPermission.STAFF_VIEW],
  },
  {
    label: "Audit logs",
    href: "/admin/audit-logs",
    icon: <ScrollText className="w-5 h-5" />,
    adminOnly: true,
    requiredPermissions: [AdminPermission.AUDIT_LOG_VIEW],
  },
  {
    label: "Cài đặt",
    href: "/admin/settings",
    icon: <Settings className="w-5 h-5" />,
    adminOnly: true,
    requiredPermissions: [
      AdminPermission.SETTINGS_MANAGE,
      AdminPermission.FINANCE_COMMISSION,
    ],
  },
];

