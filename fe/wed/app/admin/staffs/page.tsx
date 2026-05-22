'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Mail, Phone, Shield, Search, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';

export default function StaffsPage() {
  const { toast } = useToast();
  const [staffs, setStaffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [meta, setMeta] = useState<any>({});

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    const newErrors = { ...formErrors };
    if (name === 'fullName') {
      if (!value) newErrors.fullName = 'Họ tên không được để trống';
      else if (value.length < 2) newErrors.fullName = 'Họ tên quá ngắn';
      else delete newErrors.fullName;
    }
    if (name === 'email' && !editingStaff) {
      if (!value) newErrors.email = 'Email không được để trống';
      else if (!/\S+@\S+\.\S+/.test(value)) newErrors.email = 'Email không hợp lệ';
      else delete newErrors.email;
    }
    if (name === 'phone') {
      if (value && !/^0\d{9}$/.test(value)) newErrors.phone = 'SĐT không hợp lệ (10 số, bắt đầu bằng 0)';
      else delete newErrors.phone;
    }
    if (name === 'password' && !editingStaff) {
      if (!value) newErrors.password = 'Mật khẩu không được để trống';
      else if (value.length < 6) newErrors.password = 'Ít nhất 6 ký tự';
      else delete newErrors.password;
    }
    setFormErrors(newErrors);
  };

  const fetchStaffs = async (search?: string) => {
    setLoading(true);
    try {
      const res = await adminApi.getStaffs({ keyword: search || undefined });
      setStaffs(res.data.data || []);
      setMeta(res.data.meta || {});
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể tải danh sách nhân viên', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaffs(); }, []);

  const handleSearch = () => { fetchStaffs(keyword); };

  const openCreateModal = () => {
    setEditingStaff(null);
    setFormName(''); setFormEmail(''); setFormPhone(''); setFormPassword('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (staff: any) => {
    setEditingStaff(staff);
    setFormName(staff.fullName || '');
    setFormEmail(staff.email || '');
    setFormPhone(staff.phone || '');
    setFormPassword('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      if (editingStaff) {
        await adminApi.updateStaff(editingStaff.id, {
          fullName: formName,
          phone: formPhone,
        });
        toast({ title: 'Đã cập nhật nhân viên' });
      } else {
        await adminApi.createStaff({
          fullName: formName,
          email: formEmail,
          phone: formPhone,
          password: formPassword,
        });
        toast({ title: 'Đã thêm nhân viên mới' });
      }
      setIsModalOpen(false);
      fetchStaffs(keyword);
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || err.message, variant: 'destructive' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn chắc chắn muốn xóa nhân viên này?')) return;
    try {
      await adminApi.deleteStaff(id);
      toast({ title: 'Đã xóa nhân viên' });
      fetchStaffs(keyword);
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || err.message, variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (staff: any) => {
    try {
      if (staff.status === 'ACTIVE') {
        await adminApi.lockUser(staff.id);
        toast({ title: 'Đã khóa tài khoản' });
      } else {
        await adminApi.unlockUser(staff.id);
        toast({ title: 'Đã mở khóa tài khoản' });
      }
      fetchStaffs(keyword);
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Quản Lý Nhân Viên</h3>
          <p className="text-muted-foreground mt-1">
            {meta.total || staffs.length} admin và nhân viên trong hệ thống
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm Nhân Viên
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <Input
          placeholder="Tìm theo tên hoặc email..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="max-w-sm"
        />
        <Button onClick={handleSearch} variant="outline">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : staffs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Chưa có nhân viên nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tên</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Vai trò</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">SĐT</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Trạng thái</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Ngày tạo</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {staffs.map((staff) => (
                    <tr key={staff.id} className={`border-b border-border hover:bg-muted ${staff.status === 'LOCKED' ? 'opacity-60' : ''}`}>
                      <td className="py-3 px-4 text-muted-foreground font-mono text-xs">#{staff.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{staff.fullName}</span>
                          {staff.status === 'ACTIVE' && (
                            <span className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                          {staff.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`border-0 text-xs ${staff.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                          {staff.role === 'ADMIN' ? 'Admin' : 'Nhân viên'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{staff.phone || '—'}</td>
                      <td className="py-3 px-4">
                        <Badge
                          className={`border-0 text-xs ${staff.role === 'ADMIN' ? '' : 'cursor-pointer'} ${staff.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                          onClick={() => staff.role !== 'ADMIN' && handleToggleStatus(staff)}
                        >
                          {staff.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {new Date(staff.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditModal(staff)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          {staff.role !== 'ADMIN' && (
                            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(staff.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingStaff ? 'Chỉnh Sửa' : 'Thêm'} Nhân Viên</CardTitle>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Họ Tên *</label>
                  <Input value={formName} onChange={(e) => {
                    setFormName(e.target.value);
                    validateField('fullName', e.target.value);
                  }} placeholder="Nguyễn Văn A" className={formErrors.fullName ? 'border-red-500' : ''} />
                  {formErrors.fullName && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Email *</label>
                  <Input value={formEmail} onChange={(e) => {
                    setFormEmail(e.target.value);
                    validateField('email', e.target.value);
                  }} placeholder="email@company.vn" type="email" disabled={!!editingStaff} className={formErrors.email ? 'border-red-500' : ''} />
                  {formErrors.email && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">Số Điện Thoại</label>
                  <Input value={formPhone} onChange={(e) => {
                    setFormPhone(e.target.value);
                    validateField('phone', e.target.value);
                  }} placeholder="09xxxxxxxx" className={formErrors.phone ? 'border-red-500' : ''} />
                  {formErrors.phone && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.phone}</p>}
                </div>
                {!editingStaff && (
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1">Mật khẩu *</label>
                    <Input value={formPassword} onChange={(e) => {
                      setFormPassword(e.target.value);
                      validateField('password', e.target.value);
                    }} placeholder="Mật khẩu ban đầu" type="password" className={formErrors.password ? 'border-red-500' : ''} />
                    {formErrors.password && <p className="text-red-500 text-[10px] mt-0.5">{formErrors.password}</p>}
                  </div>
                )}
                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Hủy</Button>
                  <Button type="submit" disabled={formLoading || Object.keys(formErrors).length > 0}>
                    {formLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    {editingStaff ? 'Cập Nhật' : 'Thêm'}
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
