'use client';

import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Shield,
  AlertCircle,
  Search,
  MoreVertical,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const lockSchema = z.object({
  reason: z.string().min(10, 'Lý do phải có ít nhất 10 ký tự'),
  duration: z.string(),
});

type LockFormData = z.infer<typeof lockSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'provider' | 'admin';
  status: 'active' | 'locked' | 'pending' | 'suspended';
  registeredAt: string;
  totalBookings?: number;
  walletBalance?: string;
  lockedReason?: string;
  lockedUntil?: string;
}

const mockUsers: User[] = [
  {
    id: 'US001',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0912345678',
    role: 'customer',
    status: 'active',
    registeredAt: '2023-06-15',
    totalBookings: 12,
    walletBalance: '5,000,000 VNĐ',
  },
  {
    id: 'US002',
    name: 'Trần Thị B',
    email: 'tranthib@example.com',
    phone: '0923456789',
    role: 'provider',
    status: 'active',
    registeredAt: '2023-08-20',
    totalBookings: 45,
    walletBalance: '15,000,000 VNĐ',
  },
  {
    id: 'US003',
    name: 'Phạm Văn C',
    email: 'phamvanc@example.com',
    phone: '0934567890',
    role: 'customer',
    status: 'locked',
    registeredAt: '2023-10-10',
    totalBookings: 2,
    walletBalance: '500,000 VNĐ',
    lockedReason: 'Nhiều khiếu nại từ nhà cung cấp',
    lockedUntil: '2024-05-15',
  },
  {
    id: 'US004',
    name: 'Hoàng Văn D',
    email: 'hoangvand@example.com',
    phone: '0945678901',
    role: 'provider',
    status: 'pending',
    registeredAt: '2024-04-05',
    totalBookings: 0,
    walletBalance: '0 VNĐ',
  },
  {
    id: 'US005',
    name: 'Đinh Thị E',
    email: 'dinhthe@example.com',
    phone: '0956789012',
    role: 'customer',
    status: 'suspended',
    registeredAt: '2023-05-12',
    totalBookings: 8,
    walletBalance: '2,000,000 VNĐ',
    lockedReason: 'Vi phạm điều khoản sử dụng',
  },
];

const roleConfig = {
  customer: { label: 'Khách Hàng', color: 'bg-blue-100 text-blue-800' },
  provider: { label: 'Nhà Cung Cấp', color: 'bg-green-100 text-green-800' },
  admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
};

const statusConfig = {
  active: { label: 'Hoạt Động', color: 'bg-green-100 text-green-800' },
  locked: { label: 'Bị Khóa', color: 'bg-red-100 text-red-800' },
  pending: { label: 'Chờ Duyệt', color: 'bg-yellow-100 text-yellow-800' },
  suspended: { label: 'Tạm Dừng', color: 'bg-orange-100 text-orange-800' },
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LockFormData>({
    resolver: zodResolver(lockSchema),
    mode: 'onChange',
  });

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLockUser = (data: LockFormData) => {
    if (selectedUser) {
      console.log('Locking user:', selectedUser.id, data);
      setShowLockModal(false);
      setSelectedUser(null);
      reset();
      // Mock update
      alert(`Người dùng ${selectedUser.name} đã bị khóa`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Quản Lý Người Dùng</h3>
          <p className="text-gray-600 mt-1">
            {users.length} người dùng tổng cộng - {users.filter((u) => u.status === 'locked').length} bị khóa
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tên</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Vai Trò</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng Thái</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Đăng Ký</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const roleInfo = roleConfig[user.role];
                  const statusInfo = statusConfig[user.status];

                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        user.status === 'locked' ? 'bg-red-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-600">{user.id}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleInfo?.color}`}>
                          {roleInfo?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusInfo?.color}`}>
                            {user.status === 'locked' && <Lock className="w-3 h-3" />}
                            {statusInfo?.label}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{user.registeredAt}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowLockModal(true);
                            }}
                            className={user.status === 'locked' ? 'text-green-600' : 'text-red-600'}
                          >
                            {user.status === 'locked' ? (
                              <Unlock className="w-4 h-4" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Lock Modal */}
      {showLockModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                {selectedUser.status === 'locked' ? 'Mở Khóa' : 'Khóa'} Tài Khoản
              </CardTitle>
              <button
                onClick={() => {
                  setShowLockModal(false);
                  setSelectedUser(null);
                  reset();
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <p className="text-sm font-medium text-gray-900">{selectedUser.name}</p>
                <p className="text-xs text-gray-600">{selectedUser.email}</p>
              </div>

              {selectedUser.status === 'locked' && selectedUser.lockedReason && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Lý do khóa:</p>
                  <p className="text-sm text-red-900">{selectedUser.lockedReason}</p>
                  {selectedUser.lockedUntil && (
                    <p className="text-xs text-red-700 mt-2">
                      Khóa đến: {selectedUser.lockedUntil}
                    </p>
                  )}
                </div>
              )}

              {selectedUser.status !== 'locked' && (
                <form onSubmit={handleSubmit(handleLockUser)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thời Hạn Khóa
                    </label>
                    <select
                      {...register('duration')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="7">7 ngày</option>
                      <option value="30">30 ngày</option>
                      <option value="90">90 ngày</option>
                      <option value="permanent">Vĩnh viễn</option>
                    </select>
                  </div>

                  <div className="flex gap-2 justify-end">
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
                    <Button type="submit" variant="destructive">
                      Khóa Tài Khoản
                    </Button>
                  </div>
                </form>
              )}

              {selectedUser.status === 'locked' && (
                <div className="flex gap-2 justify-end">
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
                  <Button className="bg-green-600 hover:bg-green-700">
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
