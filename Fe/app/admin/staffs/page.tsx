'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, X, Mail, Phone, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const staffSchema = z.object({
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^0\d{9,10}$/, 'Số điện thoại không hợp lệ'),
  role: z.enum(['moderator', 'support', 'finance', 'manager']),
  department: z.string().min(2, 'Phòng ban phải có ít nhất 2 ký tự'),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface Staff {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'moderator' | 'support' | 'finance' | 'manager';
  department: string;
  hiredDate: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
}

const mockStaffs: Staff[] = [
  {
    id: 'ST001',
    name: 'Lê Văn A',
    email: 'levana@admin.vn',
    phone: '0987654321',
    role: 'manager',
    department: 'Quản Lý',
    hiredDate: '2023-01-15',
    status: 'active',
    lastLogin: '2024-04-10 14:30',
  },
  {
    id: 'ST002',
    name: 'Nguyễn Thị B',
    email: 'nguyenthib@admin.vn',
    phone: '0912345678',
    role: 'moderator',
    department: 'Kiểm Duyệt',
    hiredDate: '2023-06-20',
    status: 'active',
    lastLogin: '2024-04-10 13:15',
  },
  {
    id: 'ST003',
    name: 'Trần Văn C',
    email: 'tranvanc@admin.vn',
    phone: '0923456789',
    role: 'support',
    department: 'Hỗ Trợ Khách Hàng',
    hiredDate: '2023-09-10',
    status: 'active',
    lastLogin: '2024-04-10 15:45',
  },
  {
    id: 'ST004',
    name: 'Phạm Thị D',
    email: 'phamthid@admin.vn',
    phone: '0934567890',
    role: 'finance',
    department: 'Tài Chính',
    hiredDate: '2023-03-05',
    status: 'active',
    lastLogin: '2024-04-09 09:20',
  },
  {
    id: 'ST005',
    name: 'Hoàng Văn E',
    email: 'hoangvane@admin.vn',
    phone: '0945678901',
    role: 'moderator',
    department: 'Kiểm Duyệt',
    hiredDate: '2023-11-15',
    status: 'inactive',
  },
];

const roleConfig = {
  manager: { label: 'Quản Lý', color: 'bg-purple-100 text-purple-800' },
  moderator: { label: 'Kiểm Duyệt', color: 'bg-blue-100 text-blue-800' },
  support: { label: 'Hỗ Trợ', color: 'bg-green-100 text-green-800' },
  finance: { label: 'Tài Chính', color: 'bg-orange-100 text-orange-800' },
};

export default function StaffsPage() {
  const [staffs, setStaffs] = useState<Staff[]>(mockStaffs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    mode: 'onChange',
  });

  const onSubmit = (data: StaffFormData) => {
    if (editingId) {
      console.log('Updating staff:', editingId, data);
    } else {
      console.log('Creating new staff:', data);
    }
    alert(`${editingId ? 'Cập nhật' : 'Thêm'} nhân viên thành công`);
    setIsModalOpen(false);
    reset();
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Bạn chắc chắn muốn xóa nhân viên này?')) {
      console.log('Deleting staff:', id);
      alert('Nhân viên đã bị xóa');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Quản Lý Nhân Viên</h3>
          <p className="text-gray-600 mt-1">
            {staffs.filter((s) => s.status === 'active').length}/{staffs.length} nhân viên đang hoạt động
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            reset();
            setIsModalOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm Nhân Viên
        </Button>
      </div>

      {/* Staffs Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Tên</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Vai Trò</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Phòng Ban</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Đăng Nhập Cuối</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {staffs.map((staff) => {
                  const roleInfo = roleConfig[staff.role];

                  return (
                    <tr
                      key={staff.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        staff.status === 'inactive' ? 'opacity-60' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900 flex items-center gap-2">
                            {staff.name}
                            {staff.status === 'active' && (
                              <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                            )}
                          </p>
                          <p className="text-xs text-gray-600">{staff.id}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{staff.email}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${roleInfo?.color}`}>
                          <Shield className="w-3 h-3" />
                          {roleInfo?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{staff.department}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {staff.lastLogin ? (
                          <div>
                            <p className="text-sm">{staff.lastLogin}</p>
                          </div>
                        ) : (
                          <p className="text-gray-500">Chưa đăng nhập</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(staff.id);
                              setIsModalOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(staff.id)}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingId ? 'Chỉnh Sửa' : 'Thêm'} Nhân Viên</CardTitle>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                  setEditingId(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ Tên
                  </label>
                  <Input
                    placeholder="Nhập họ tên"
                    {...register('name')}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    placeholder="email@admin.vn"
                    type="email"
                    {...register('email')}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số Điện Thoại
                  </label>
                  <Input
                    placeholder="0987654321"
                    {...register('phone')}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vai Trò
                  </label>
                  <select
                    {...register('role')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="moderator">Kiểm Duyệt</option>
                    <option value="support">Hỗ Trợ Khách Hàng</option>
                    <option value="finance">Tài Chính</option>
                    <option value="manager">Quản Lý</option>
                  </select>
                  {errors.role && (
                    <p className="text-red-600 text-sm mt-1">{errors.role.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phòng Ban
                  </label>
                  <Input
                    placeholder="Nhập phòng ban"
                    {...register('department')}
                    className={errors.department ? 'border-red-500' : ''}
                  />
                  {errors.department && (
                    <p className="text-red-600 text-sm mt-1">{errors.department.message}</p>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      reset();
                      setEditingId(null);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit">
                    {editingId ? 'Cập Nhật' : 'Thêm'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
