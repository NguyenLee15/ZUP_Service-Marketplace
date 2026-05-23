'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, X, Mail, Phone, Shield, Search, Loader2,
  Lock, Unlock, Settings2, CheckCircle2, ShieldCheck, Gavel,
  Wallet, FolderTree, Eye, FileCheck, Bot, ListChecks, Banknote, Percent
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';

// --- Permission modules definition ---
const PERMISSION_MODULES = [
  {
    key: 'kyc',
    label: 'Module KYC',
    icon: ShieldCheck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    permissions: [
      { key: 'kyc_view', label: 'Xem danh sách' },
      { key: 'kyc_approve', label: 'Duyệt hồ sơ' },
      { key: 'kyc_reject', label: 'Từ chối hồ sơ' },
    ],
  },
  {
    key: 'dispute',
    label: 'Module Tranh chấp',
    icon: Gavel,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    permissions: [
      { key: 'dispute_view', label: 'Xem khiếu nại' },
      { key: 'dispute_resolve', label: 'Xử lý phán quyết' },
      { key: 'dispute_ai', label: 'Sử dụng trợ lý AI' },
    ],
  },
  {
    key: 'service',
    label: 'Dịch vụ & Danh mục',
    icon: FolderTree,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    permissions: [
      { key: 'service_manage', label: 'Quản lý dịch vụ' },
      { key: 'category_manage', label: 'Quản lý danh mục' },
      { key: 'provider_approve', label: 'Duyệt thợ mới' },
    ],
  },
  {
    key: 'finance',
    label: 'Module Tài chính',
    icon: Wallet,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    permissions: [
      { key: 'finance_revenue', label: 'Xem doanh thu' },
      { key: 'finance_wallet', label: 'Đối soát ví' },
      { key: 'finance_commission', label: 'Cấu hình hoa hồng' },
    ],
  },
];

export default function StaffsPage() {
  const { toast } = useToast();
  const [staffs, setStaffs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [meta, setMeta] = useState<any>({});

  // Create/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Permission Modal
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [permStaff, setPermStaff] = useState<any>(null);
  const [permState, setPermState] = useState<Record<string, boolean>>({});
  const [permSaving, setPermSaving] = useState(false);

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

  const openPermModal = (staff: any) => {
    setPermStaff(staff);
    // Initialize permissions from staff.permissions or empty
    const initial: Record<string, boolean> = {};
    PERMISSION_MODULES.forEach(mod => {
      mod.permissions.forEach(p => {
        initial[p.key] = staff.permissions?.includes(p.key) || false;
      });
    });
    setPermState(initial);
    setPermModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
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
        await adminApi.lockUser(staff.id, { reason: 'Khóa tài khoản nhân viên bởi quản trị viên' });
        toast({ title: 'Đã khóa tài khoản nhân viên' });
      } else {
        await adminApi.unlockUser(staff.id);
        toast({ title: 'Đã mở khóa tài khoản' });
      }
      fetchStaffs(keyword);
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleSavePermissions = async () => {
    if (!permStaff) return;
    setPermSaving(true);
    try {
      const enabledPermissions = Object.entries(permState)
        .filter(([, v]) => v)
        .map(([k]) => k);
      // NOTE: This is a UI-only feature for now. 
      // Backend API for staff permissions can be wired here when available.
      // await adminApi.updateStaffPermissions(permStaff.id, { permissions: enabledPermissions });
      toast({ title: '✅ Đã lưu phân quyền (UI only)', description: `${enabledPermissions.length} quyền được cấp cho ${permStaff.fullName}` });
      setPermModalOpen(false);
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.message || err.message, variant: 'destructive' });
    } finally {
      setPermSaving(false);
    }
  };

  const countActivePerms = () => Object.values(permState).filter(Boolean).length;
  const totalPerms = PERMISSION_MODULES.reduce((acc, m) => acc + m.permissions.length, 0);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">
            Quản Lý Nhân Viên
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {meta.total || staffs.length} nhân viên trong hệ thống • Phân quyền module chi tiết
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-900/10 h-10 px-5"
        >
          <Plus className="w-4 h-4" />
          Thêm nhân viên
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Tìm theo tên hoặc email..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10 h-10 rounded-xl border-slate-200 focus:border-slate-400 bg-white"
          />
        </div>
        <Button onClick={handleSearch} variant="outline" className="rounded-xl border-slate-200 h-10 px-4">
          <Search className="w-4 h-4" />
        </Button>
      </div>

      {/* Staff Table */}
      <Card className="border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : staffs.length === 0 ? (
            <div className="text-center py-16">
              <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-600 text-sm">Chưa có nhân viên nào</p>
              <p className="text-xs text-slate-400 mt-1">Nhấn "Thêm nhân viên" để bắt đầu</p>
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
                  {staffs.map((staff, idx) => (
                    <tr
                      key={staff.id}
                      className={`group hover:bg-slate-50/80 transition-colors ${staff.status === 'LOCKED' ? 'opacity-60' : ''}`}
                    >
                      <td className="py-3 px-4 text-slate-400 font-mono text-xs">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-600 text-sm overflow-hidden border border-slate-200">
                              {staff.avatarUrl
                                ? <img src={staff.avatarUrl} alt="" className="w-full h-full object-cover" />
                                : staff.fullName?.charAt(0)?.toUpperCase()
                              }
                            </div>
                            <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                              staff.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-300'
                            }`} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm">{staff.fullName}</p>
                            <p className="text-[11px] text-slate-400 font-mono">ID: {staff.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`border-0 text-[10px] font-bold ${
                          staff.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {staff.role === 'ADMIN' ? 'Admin' : 'Nhân viên'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <p className="text-xs text-slate-600 flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {staff.email}
                          </p>
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Phone className="w-3 h-3" />
                            {staff.phone || '—'}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => staff.role !== 'ADMIN' && handleToggleStatus(staff)}
                          className={staff.role === 'ADMIN' ? '' : 'cursor-pointer'}
                          disabled={staff.role === 'ADMIN'}
                        >
                          <Badge className={`border-0 text-[10px] font-bold ${
                            staff.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
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
                            onClick={() => openEditModal(staff)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {staff.role !== 'ADMIN' && (
                            <>
                              <button
                                onClick={() => openPermModal(staff)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                                title="Phân quyền"
                              >
                                <Settings2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(staff.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
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

      {/* ===== CREATE / EDIT MODAL ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {editingStaff ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {editingStaff ? `ID: ${editingStaff.id}` : 'Nhân viên mới sẽ có vai trò STAFF'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Họ Tên *</label>
                <Input
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); validateField('fullName', e.target.value); }}
                  placeholder="Nguyễn Văn A"
                  className={`rounded-xl h-10 ${formErrors.fullName ? 'border-red-400' : 'border-slate-200'}`}
                />
                {formErrors.fullName && <p className="text-red-500 text-[10px] mt-1">{formErrors.fullName}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Email *</label>
                <Input
                  value={formEmail}
                  onChange={(e) => { setFormEmail(e.target.value); validateField('email', e.target.value); }}
                  placeholder="email@homeserve.vn"
                  type="email"
                  disabled={!!editingStaff}
                  className={`rounded-xl h-10 ${formErrors.email ? 'border-red-400' : 'border-slate-200'}`}
                />
                {formErrors.email && <p className="text-red-500 text-[10px] mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Số Điện Thoại</label>
                <Input
                  value={formPhone}
                  onChange={(e) => { setFormPhone(e.target.value); validateField('phone', e.target.value); }}
                  placeholder="09xxxxxxxx"
                  className={`rounded-xl h-10 ${formErrors.phone ? 'border-red-400' : 'border-slate-200'}`}
                />
                {formErrors.phone && <p className="text-red-500 text-[10px] mt-1">{formErrors.phone}</p>}
              </div>
              {!editingStaff && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">Mật khẩu *</label>
                  <Input
                    value={formPassword}
                    onChange={(e) => { setFormPassword(e.target.value); validateField('password', e.target.value); }}
                    placeholder="Mật khẩu ban đầu"
                    type="password"
                    className={`rounded-xl h-10 ${formErrors.password ? 'border-red-400' : 'border-slate-200'}`}
                  />
                  {formErrors.password && <p className="text-red-500 text-[10px] mt-1">{formErrors.password}</p>}
                </div>
              )}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-xl">
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={formLoading || Object.keys(formErrors).length > 0}
                  className="rounded-xl bg-slate-900 hover:bg-slate-800"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                  {editingStaff ? 'Cập nhật' : 'Thêm nhân viên'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== PERMISSION MODAL ===== */}
      {permModalOpen && permStaff && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-purple-600" />
                  Phân quyền chi tiết
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cấp quyền truy cập module cho <strong className="text-slate-600">{permStaff.fullName}</strong>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px] font-bold">
                  {countActivePerms()}/{totalPerms} quyền
                </Badge>
                <button
                  onClick={() => setPermModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {PERMISSION_MODULES.map((mod) => {
                  const Icon = mod.icon;
                  const moduleActive = mod.permissions.some(p => permState[p.key]);

                  return (
                    <div
                      key={mod.key}
                      className={`rounded-xl border p-5 transition-all ${
                        moduleActive
                          ? 'border-slate-300 bg-white shadow-sm'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-8 h-8 rounded-lg ${mod.bgColor} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${mod.color}`} />
                        </div>
                        <h4 className="font-bold text-sm text-slate-800">{mod.label}</h4>
                      </div>
                      <div className="space-y-3">
                        {mod.permissions.map((perm) => (
                          <label
                            key={perm.key}
                            className="flex items-center gap-3 cursor-pointer group"
                          >
                            <input
                              type="checkbox"
                              checked={permState[perm.key] || false}
                              onChange={(e) => setPermState(prev => ({
                                ...prev,
                                [perm.key]: e.target.checked,
                              }))}
                              className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                              {perm.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <p className="text-[10px] text-slate-400">
                Thay đổi quyền sẽ có hiệu lực ngay khi lưu
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setPermModalOpen(false)}
                  className="rounded-xl"
                >
                  Hủy bỏ
                </Button>
                <Button
                  onClick={handleSavePermissions}
                  disabled={permSaving}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20"
                >
                  {permSaving && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                  Lưu phân quyền
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
