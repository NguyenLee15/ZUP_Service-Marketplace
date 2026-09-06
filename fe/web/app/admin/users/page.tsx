'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Lock,
  Unlock,
  AlertCircle,
  Search,
  Users,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdminPermissionGuard } from '@/features/admin/components/AdminPermissionGuard';
import { AdminPermission } from '@/types/admin-permissions';

const lockSchema = z.object({
  reason: z.string().min(10, 'Lý do phải có ít nhất 10 ký tự'),
  duration: z.string(),
});

type LockFormData = z.infer<typeof lockSchema>;

const roleConfig: Record<string, { label: string; color: string }> = {
  CUSTOMER: { label: 'Khách hàng', color: 'border-slate-200 bg-slate-100 text-slate-700' },
  PROVIDER: { label: 'Thợ đối tác', color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  ADMIN: { label: 'Admin', color: 'border-slate-300 bg-slate-900 text-white' },
  STAFF: { label: 'Nhân viên', color: 'border-slate-200 bg-slate-100 text-slate-700' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Hoạt động', color: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  LOCKED: { label: 'Bị khóa', color: 'border-rose-200 bg-rose-50 text-rose-700' },
  PENDING: { label: 'Chờ duyệt', color: 'border-amber-200 bg-amber-50 text-amber-700' },
};

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<ApiPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ApiPayload | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'LOCKED'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const statusCounts = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.status === 'ACTIVE').length,
    pending: users.filter((user) => user.status === 'PENDING').length,
    locked: users.filter((user) => user.status === 'LOCKED').length,
  }), [users]);

  const filteredUsers = useMemo(
    () => statusFilter === 'ALL'
      ? users
      : users.filter((user) => user.status === statusFilter),
    [statusFilter, users],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LockFormData>({
    resolver: zodResolver(lockSchema),
    mode: 'onChange',
  });

  const fetchUsers = () => {
    setLoading(true);
    adminApi.getUsers({
      page,
      limit: 10,
      role: roleFilter,
      ...(searchTerm ? { keyword: searchTerm } : {}),
    })
      .then((res) => {
        setUsers(res.data.data || []);
        setTotalPages(res.data.meta?.totalPages || 1);
      })
      .catch(() => {
        setUsers([]);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, roleFilter, page]);

  const handleLockUser = async (data: LockFormData) => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await adminApi.lockUser(selectedUser.id, { reason: data.reason });
      toast({ title: 'Đã khóa tài khoản thành công' });
      setShowLockModal(false);
      setSelectedUser(null);
      reset();
      fetchUsers();
    } catch (err: ApiPayload) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message || err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlockUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await adminApi.unlockUser(selectedUser.id);
      toast({ title: 'Đã mở khóa tài khoản thành công' });
      setShowLockModal(false);
      setSelectedUser(null);
      reset();
      fetchUsers();
    } catch (err: ApiPayload) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message || err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminPermissionGuard permission={AdminPermission.USER_VIEW}>
      <div className="-m-5 flex min-h-[calc(100vh-64px)] flex-col xl:-m-6">
      <div className="shrink-0 border-b border-[var(--admin-border)] bg-white px-5 pt-5 xl:px-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Quản lý người dùng
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Giám sát và quản lý tài khoản khách hàng và thợ đối tác.
            </p>
        </div>
          <div className="rounded-md border border-[var(--admin-border)] bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
            Tạo tài khoản nhân viên tại mục Nhân viên
          </div>
      </div>

        <div className="flex gap-8">
              {[
                { value: 'CUSTOMER', label: 'Khách hàng', icon: Users },
              { value: 'PROVIDER', label: 'Thợ (Đối tác)', icon: Wrench },
              ].map((option) => {
                const Icon = option.icon;
                const active = roleFilter === option.value;
                return (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setRoleFilter(option.value as 'CUSTOMER' | 'PROVIDER');
                      setStatusFilter('ALL');
                      setSelectedUser(null);
                      setPage(1);
                    }}
                  className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                    active
                      ? 'border-slate-950 text-slate-950'
                      : 'border-transparent text-slate-500 hover:text-slate-950'
                  }`}
                  >
                  <Icon className="h-4 w-4" />
                    {option.label}
                </button>
                );
              })}
            </div>
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-canvas)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between xl:px-6">
        <div className="flex max-w-full overflow-x-auto rounded-md border border-[var(--admin-border)] bg-white p-1">
          {[
            { value: 'ALL', label: `Tất cả (${statusCounts.total})`, tone: 'text-slate-700 hover:bg-slate-100', activeTone: 'bg-slate-100 text-slate-950' },
            { value: 'ACTIVE', label: `Hoạt động (${statusCounts.active})`, tone: 'text-slate-600 hover:bg-slate-100', activeTone: 'bg-emerald-50 text-emerald-700' },
            { value: 'PENDING', label: `Chờ duyệt (${statusCounts.pending})`, tone: 'text-amber-700 hover:bg-amber-50', activeTone: 'bg-amber-50 text-amber-700' },
            { value: 'LOCKED', label: `Bị khóa (${statusCounts.locked})`, tone: 'text-rose-700 hover:bg-rose-50', activeTone: 'bg-rose-50 text-rose-700' },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setStatusFilter(item.value as 'ALL' | 'ACTIVE' | 'PENDING' | 'LOCKED')}
              className={`h-8 shrink-0 rounded px-3 text-xs font-semibold transition-colors ${
                statusFilter === item.value ? item.activeTone : item.tone
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

      </div>

      <div className="flex-1 overflow-auto bg-white p-5 xl:p-6">
        <div className="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-white">
          {loading ? (
            <div className="space-y-2 p-4">{[...Array(8)].map((_, i) => <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />)}</div>
          ) : filteredUsers.length === 0 ? (
            <p className="py-12 text-center text-sm font-medium text-slate-500">Không tìm thấy người dùng</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[980px] text-left">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Liên hệ</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Ngày tham gia</th>
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const roleInfo = roleConfig[user.role] || { label: user.role, color: 'bg-muted text-foreground' };
                    const statusInfo = statusConfig[user.status] || { label: user.status, color: 'bg-muted text-foreground' };

                    return (
                      <tr
                        key={user.id}
                        className={`group transition-colors ${
                          user.status === 'LOCKED' ? 'bg-rose-50/35' : ''
                        }`}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded bg-slate-100 font-semibold text-slate-600 ring-1 ring-slate-200">
                              {user.avatarUrl ? <img src={user.avatarUrl} alt={`Ảnh đại diện của ${user.fullName || 'người dùng'}`} className="w-full h-full object-cover" /> : user.fullName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-950">{user.fullName}</p>
                              <p className="font-mono text-[11px] text-slate-500">ID: USR-{user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <p className="text-slate-800">{user.email}</p>
                          <p className="text-xs text-slate-500">{user.phone || 'Chưa cập nhật'}</p>
                        </td>
                        <td>
                          <Badge variant="outline" className={`rounded px-2 py-0.5 text-[11px] font-semibold ${roleInfo.color}`}>{roleInfo.label}</Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold ${statusInfo.color}`}>
                              {user.status === 'LOCKED' && <Lock className="w-3 h-3" />}
                              {statusInfo.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="text-right">
                          {user.role !== 'ADMIN' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowLockModal(true);
                              }}
                              className={`h-8 w-8 rounded opacity-80 transition-opacity group-hover:opacity-100 ${
                                user.status === 'LOCKED'
                                  ? 'text-emerald-700 hover:bg-emerald-50'
                                  : 'text-rose-700 hover:bg-rose-50'
                              }`}
                            >
                              {user.status === 'LOCKED' ? (
                                <Unlock className="w-4 h-4" />
                              ) : (
                                <Lock className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && filteredUsers.length > 0 && (
            <div className="flex items-center justify-between border-t border-[var(--admin-border)] px-4 py-3 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Trước
                </Button>
                <Button variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  Tiếp
                </Button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700">
                    Trang <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
                    Trước
                  </Button>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                    Tiếp
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={showLockModal && Boolean(selectedUser)}
        onOpenChange={(open) => {
          setShowLockModal(open);
          if (!open) {
            setSelectedUser(null);
            reset();
          }
        }}
      >
        {selectedUser && (
          <DialogContent className="overflow-hidden rounded-xl border-[var(--admin-border)] bg-white p-0 shadow-2xl">
            <DialogHeader className={`border-b border-[var(--admin-border)] p-5 ${selectedUser.status === 'LOCKED' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
              <DialogTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className={`h-5 w-5 ${selectedUser.status === 'LOCKED' ? 'text-green-600' : 'text-red-600'}`} />
                {selectedUser.status === 'LOCKED' ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
              </DialogTitle>
              <DialogDescription>
                {selectedUser.status === 'LOCKED'
                  ? 'Tài khoản sẽ được phép đăng nhập lại ngay sau khi mở khóa.'
                  : 'Người dùng sẽ không thể đăng nhập cho đến khi tài khoản được mở khóa.'}
              </DialogDescription>
            </DialogHeader>
            <div className="p-5">
              <div className="mb-4 rounded-md border border-[var(--admin-border)] bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-950">{selectedUser.fullName}</p>
                <p className="text-xs text-slate-500">{selectedUser.email}</p>
              </div>

              {selectedUser.status !== 'LOCKED' && (
                <form onSubmit={handleSubmit(handleLockUser)} className="space-y-4">
                  <div>
                    <label htmlFor="lock-reason" className="block text-sm font-medium text-foreground/80 mb-1">
                      Lý do khóa tài khoản
                    </label>
                    <textarea
                      id="lock-reason"
                      placeholder="Ví dụ: tài khoản có dấu hiệu spam hoặc vi phạm chính sách…"
                      {...register('reason')}
                      className="w-full rounded-md border border-[var(--admin-border)] px-3 py-2 text-sm focus:border-slate-700 focus:ring-2 focus:ring-slate-900/10"
                      rows={3}
                      aria-invalid={Boolean(errors.reason)}
                      aria-describedby={errors.reason ? 'lock-reason-error' : undefined}
                    />
                    {errors.reason && (
                      <p id="lock-reason-error" className="text-red-600 text-sm mt-1">{errors.reason.message}</p>
                    )}
                  </div>

                  <DialogFooter className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowLockModal(false);
                        setSelectedUser(null);
                        reset();
                      }}
                    >
                      Hủy
                    </Button>
                    <Button type="submit" variant="destructive" disabled={actionLoading}>
                      Khóa tài khoản
                    </Button>
                  </DialogFooter>
                </form>
              )}

              {selectedUser.status === 'LOCKED' && (
                <DialogFooter className="pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowLockModal(false);
                      setSelectedUser(null);
                      reset();
                    }}
                  >
                    Hủy
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={handleUnlockUser} disabled={actionLoading}>
                    Mở khóa ngay
                  </Button>
                </DialogFooter>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
      </div>
    </AdminPermissionGuard>
  );
}
