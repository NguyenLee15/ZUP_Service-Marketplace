'use client';

import React from 'react';
import {
  Edit2,
  Trash2,
  Mail,
  Phone,
  Lock,
  Settings2,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Role } from '@/types';
import { StaffAccount } from '../types/staff.types';

interface StaffTableProps {
  staffs: StaffAccount[];
  loading: boolean;
  permissionsLoading: boolean;
  permissionsError: string;
  onEdit: (staff: StaffAccount) => void;
  onOpenPerms: (staff: StaffAccount) => void;
  onToggleStatus: (staff: StaffAccount) => void;
  onDelete: (staff: StaffAccount) => void;
}

export function StaffTable({
  staffs,
  loading,
  permissionsLoading,
  permissionsError,
  onEdit,
  onOpenPerms,
  onToggleStatus,
  onDelete,
}: StaffTableProps) {
  return (
    <Card className="border-slate-200/80 shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-3 p-6">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-slate-100/70 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : staffs.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              Không tìm thấy nhân viên nào
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Nhấn &quot;Thêm nhân viên&quot; để tạo tài khoản mới
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4 text-left">#</th>
                  <th className="py-3 px-4 text-left">Nhân viên</th>
                  <th className="py-3 px-4 text-left">Vai trò</th>
                  <th className="py-3 px-4 text-left">Liên hệ</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-left">Ngày tạo</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffs.map((staff, idx) => {
                  const isLocked = staff.status === 'LOCKED';
                  const isAdminRole = staff.role === Role.ADMIN;
                  return (
                    <tr
                      key={staff.id}
                      className={`group hover:bg-slate-50/80 transition-colors ${
                        isLocked ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-slate-400 font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm overflow-hidden border border-slate-200">
                              {staff.avatarUrl ? (
                                <img
                                  src={staff.avatarUrl}
                                  alt={`Ảnh đại diện của nhân viên ${staff.fullName}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                staff.fullName?.charAt(0)?.toUpperCase() || 'U'
                              )}
                            </div>
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                staff.status === 'ACTIVE'
                                  ? 'bg-emerald-400'
                                  : 'bg-slate-300'
                              }`}
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">
                              {staff.fullName}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">
                              ID: {staff.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`border-0 text-[10px] font-bold ${
                            isAdminRole
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {isAdminRole ? 'Admin' : 'Nhân viên'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="text-xs text-slate-600 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{staff.email}</span>
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Phone className="w-3 h-3 shrink-0" />
                            {staff.phone || '—'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => !isAdminRole && onToggleStatus(staff)}
                          className={isAdminRole ? '' : 'cursor-pointer'}
                          disabled={isAdminRole}
                          title={isAdminRole ? 'Không thể khóa Admin' : 'Bấm để đổi trạng thái'}
                        >
                          <Badge
                            className={`border-0 text-[10px] font-bold ${
                              staff.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {staff.status === 'ACTIVE' ? (
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Hoạt động
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                Đã khóa
                              </span>
                            )}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">
                        {new Date(staff.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(staff)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Chỉnh sửa thông tin"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {!isAdminRole && (
                            <>
                              <button
                                onClick={() => onOpenPerms(staff)}
                                disabled={
                                  permissionsLoading || Boolean(permissionsError)
                                }
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                title={permissionsError || 'Phân quyền module'}
                              >
                                <Settings2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDelete(staff)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Xóa nhân viên"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

