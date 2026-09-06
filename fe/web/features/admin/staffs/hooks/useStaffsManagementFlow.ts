'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/features/auth/services/api';
import { useToast } from '@/components/ui/use-toast';
import {
  StaffAccount,
  StaffPaginationMeta,
  AdminPermissionGroup,
  StaffFormErrors,
} from '../types/staff.types';

function unwrapPermissionGroups(payload: unknown): AdminPermissionGroup[] {
  const container = payload as { data?: { data?: AdminPermissionGroup[] } | AdminPermissionGroup[] };
  const data = container?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function useStaffsManagementFlow() {
  const { toast } = useToast();
  const [staffs, setStaffs] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [meta, setMeta] = useState<StaffPaginationMeta>({});

  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffAccount | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formErrors, setFormErrors] = useState<StaffFormErrors>({});

  // Permissions Modal State
  const [permModalOpen, setPermModalOpen] = useState(false);
  const [permStaff, setPermStaff] = useState<StaffAccount | null>(null);
  const [permState, setPermState] = useState<Record<string, boolean>>({});
  const [permSaving, setPermSaving] = useState(false);
  const [permissionGroups, setPermissionGroups] = useState<AdminPermissionGroup[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);
  const [permissionsError, setPermissionsError] = useState('');

  // Delete Dialog State
  const [deleteTarget, setDeleteTarget] = useState<StaffAccount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchStaffs = useCallback(async (search?: string) => {
    setLoading(true);
    try {
      const res = await adminApi.getStaffs({ keyword: search || undefined });
      setStaffs((res.data.data as StaffAccount[]) || []);
      setMeta((res.data.meta as StaffPaginationMeta) || {});
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách nhân viên',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchPermissionGroups = useCallback(async () => {
    setPermissionsLoading(true);
    setPermissionsError('');
    try {
      const res = await adminApi.getPermissions();
      const groups = unwrapPermissionGroups(res.data);
      if (!groups.length) {
        throw new Error('Hệ thống không trả về ma trận permissions');
      }
      setPermissionGroups(groups);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const message =
        e.response?.data?.error?.message ||
        e.message ||
        'Không thể tải danh sách quyền';
      setPermissionsError(message);
      setPermissionGroups([]);
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffs();
    fetchPermissionGroups();
  }, [fetchStaffs, fetchPermissionGroups]);

  const handleSearch = () => {
    fetchStaffs(keyword);
  };

  const validateField = (name: string, value: string) => {
    const newErrors = { ...formErrors };
    if (name === 'fullName') {
      if (!value) newErrors.fullName = 'Họ tên không được để trống';
      else if (value.length < 2) newErrors.fullName = 'Họ tên quá ngắn';
      else delete newErrors.fullName;
    }
    if (name === 'email' && !editingStaff) {
      if (!value) newErrors.email = 'Email không được để trống';
      else if (!/\S+@\S+\.\S+/.test(value))
        newErrors.email = 'Email không hợp lệ';
      else delete newErrors.email;
    }
    if (name === 'phone') {
      if (value && !/^0\d{9}$/.test(value))
        newErrors.phone = 'SĐT không hợp lệ (10 số, bắt đầu bằng 0)';
      else delete newErrors.phone;
    }
    if (name === 'password' && !editingStaff) {
      if (!value) newErrors.password = 'Mật khẩu không được để trống';
      else if (value.length < 6) newErrors.password = 'Ít nhất 6 ký tự';
      else delete newErrors.password;
    }
    setFormErrors(newErrors);
  };

  const openCreateModal = () => {
    setEditingStaff(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (staff: StaffAccount) => {
    setEditingStaff(staff);
    setFormName(staff.fullName || '');
    setFormEmail(staff.email || '');
    setFormPhone(staff.phone || '');
    setFormPassword('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openPermModal = (staff: StaffAccount) => {
    if (permissionsLoading) {
      toast({
        title: 'Đang tải danh sách quyền',
        description: 'Vui lòng thử lại sau vài giây.',
      });
      return;
    }
    if (permissionsError || permissionGroups.length === 0) {
      toast({
        title: 'Không thể mở phân quyền',
        description: permissionsError || 'Danh sách quyền đang trống.',
        variant: 'destructive',
      });
      return;
    }
    setPermStaff(staff);
    const initial: Record<string, boolean> = {};
    permissionGroups.forEach((mod) => {
      mod.permissions.forEach((p) => {
        initial[p.value] =
          (staff.permissions as string[])?.includes(p.value) || false;
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
        toast({ title: 'Đã cập nhật thông tin nhân viên' });
      } else {
        await adminApi.createStaff({
          fullName: formName,
          email: formEmail,
          phone: formPhone,
          password: formPassword,
        });
        toast({ title: 'Đã tạo tài khoản nhân viên mới' });
      }
      setIsModalOpen(false);
      fetchStaffs(keyword);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast({
        title: 'Lỗi',
        description: e.response?.data?.message || e.message,
        variant: 'destructive',
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (staff: StaffAccount) => {
    try {
      if (staff.status === 'ACTIVE') {
        await adminApi.lockUser(staff.id, {
          reason: 'Khóa tài khoản nhân viên bởi quản trị viên',
        });
        toast({ title: 'Đã khóa tài khoản nhân viên' });
      } else {
        await adminApi.unlockUser(staff.id);
        toast({ title: 'Đã mở khóa tài khoản nhân viên' });
      }
      fetchStaffs(keyword);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast({
        title: 'Lỗi',
        description: e.response?.data?.message || e.message,
        variant: 'destructive',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await adminApi.deleteStaff(deleteTarget.id);
      toast({ title: 'Đã xóa tài khoản nhân viên thành công' });
      setDeleteTarget(null);
      fetchStaffs(keyword);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast({
        title: 'Lỗi',
        description: e.response?.data?.message || e.message,
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!permStaff) return;
    setPermSaving(true);
    try {
      const enabledPermissions = Object.entries(permState)
        .filter(([, v]) => v)
        .map(([k]) => k);

      await adminApi.updateStaff(permStaff.id, {
        permissions: enabledPermissions,
      });
      toast({ title: '✅ Đã cập nhật phân quyền thành công!' });
      setPermModalOpen(false);
      fetchStaffs(keyword);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      toast({
        title: 'Lỗi',
        description: e.response?.data?.message || e.message,
        variant: 'destructive',
      });
    } finally {
      setPermSaving(false);
    }
  };

  const toggleGroupPermissions = (group: AdminPermissionGroup, checked: boolean) => {
    setPermState((prev) => {
      const next = { ...prev };
      group.permissions.forEach((p) => {
        next[p.value] = checked;
      });
      return next;
    });
  };

  const toggleAllPermissions = (checked: boolean) => {
    setPermState((prev) => {
      const next = { ...prev };
      permissionGroups.forEach((group) => {
        group.permissions.forEach((p) => {
          next[p.value] = checked;
        });
      });
      return next;
    });
  };

  return {
    staffs,
    loading,
    keyword,
    setKeyword,
    meta,
    handleSearch,
    fetchStaffs,
    // Form Modal
    isModalOpen,
    setIsModalOpen,
    editingStaff,
    formLoading,
    formName,
    setFormName,
    formEmail,
    setFormEmail,
    formPhone,
    setFormPhone,
    formPassword,
    setFormPassword,
    formErrors,
    validateField,
    openCreateModal,
    openEditModal,
    handleSubmitForm,
    // Permissions Modal
    permModalOpen,
    setPermModalOpen,
    permStaff,
    permState,
    setPermState,
    permSaving,
    permissionGroups,
    permissionsLoading,
    permissionsError,
    openPermModal,
    handleSavePermissions,
    toggleGroupPermissions,
    toggleAllPermissions,
    // Status & Delete
    handleToggleStatus,
    deleteTarget,
    setDeleteTarget,
    deleteLoading,
    handleConfirmDelete,
  };
}

