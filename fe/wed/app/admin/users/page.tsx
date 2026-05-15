'use client';

import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  AlertCircle,
  Search,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';
import { Badge } from '@/components/ui/badge';

const lockSchema = z.object({
  reason: z.string().min(10, 'Lý do phải có ít nhất 10 ký tự'),
  duration: z.string(),
});

type LockFormData = z.infer<typeof lockSchema>;

const roleConfig: Record<string, { label: string; color: string }> = {
  CUSTOMER: { label: 'Khách Hàng', color: 'bg-blue-100 text-blue-800' },
  PROVIDER: { label: 'Nhà Cung Cấp', color: 'bg-green-100 text-green-800' },
  ADMIN: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
  STAFF: { label: 'Nhân Viên', color: 'bg-purple-100 text-purple-800' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: 'Hoạt Động', color: 'bg-green-100 text-green-800' },
  LOCKED: { label: 'Bị Khóa', color: 'bg-red-100 text-red-800' },
  PENDING: { label: 'Chờ Duyệt', color: 'bg-yellow-100 text-yellow-800' },
};

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
    adminApi.getUsers(searchTerm ? { keyword: searchTerm } : {})
      .then((res) => setUsers(res.data.data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleLockUser = async (data: LockFormData) => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await adminApi.lockUser(selectedUser.id);
      toast({ title: 'Đã khóa tài khoản' });
      setShowLockModal(false);
      setSelectedUser(null);
      reset();
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlockUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      await adminApi.unlockUser(selectedUser.id);
      toast({ title: 'Đã mở khóa tài khoản' });
      setShowLockModal(false);
      setSelectedUser(null);
      reset();
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Quản Lý Người Dùng</h3>
          <p className="text-muted-foreground mt-1">Danh sách người dùng trong hệ thống</p>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc email..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}</div>
          ) : users.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Không tìm thấy người dùng</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Người dùng</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email & SĐT</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Vai Trò</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng Thái</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Đăng Ký</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const roleInfo = roleConfig[user.role] || { label: user.role, color: 'bg-muted text-foreground' };
                    const statusInfo = statusConfig[user.status] || { label: user.status, color: 'bg-muted text-foreground' };

                    return (
                      <tr
                        key={user.id}
                        className={`border-b border-border hover:bg-muted ${
                          user.status === 'LOCKED' ? 'bg-red-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-600 overflow-hidden">
                              {user.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> : user.fullName?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{user.fullName}</p>
                              <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-foreground">{user.email}</p>
                          <p className="text-xs text-muted-foreground">{user.phone || 'Chưa cập nhật'}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${roleInfo.color} border-0`}>{roleInfo.label}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Badge className={`${statusInfo.color} border-0 flex items-center gap-1`}>
                              {user.status === 'LOCKED' && <Lock className="w-3 h-3" />}
                              {statusInfo.label}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-3 px-4">
                          {user.role !== 'ADMIN' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowLockModal(true);
                              }}
                              className={user.status === 'LOCKED' ? 'text-green-600' : 'text-red-600'}
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
        </CardContent>
      </Card>

      {/* Lock/Unlock Modal */}
      {showLockModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className={`w-5 h-5 ${selectedUser.status === 'LOCKED' ? 'text-green-600' : 'text-red-600'}`} />
                {selectedUser.status === 'LOCKED' ? 'Mở Khóa' : 'Khóa'} Tài Khoản
              </CardTitle>
              <button
                onClick={() => {
                  setShowLockModal(false);
                  setSelectedUser(null);
                  reset();
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground">{selectedUser.fullName}</p>
                <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
              </div>

              {selectedUser.status !== 'LOCKED' && (
                <form onSubmit={handleSubmit(handleLockUser)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                      Lý Do Khóa Tài Khoản
                    </label>
                    <textarea
                      placeholder="Nhập lý do chi tiết..."
                      {...register('reason')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    {errors.reason && (
                      <p className="text-red-600 text-sm mt-1">{errors.reason.message}</p>
                    )}
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
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
                      Khóa Tài Khoản
                    </Button>
                  </div>
                </form>
              )}

              {selectedUser.status === 'LOCKED' && (
                <div className="flex gap-2 justify-end pt-2">
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
                    Mở Khóa Ngay
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
