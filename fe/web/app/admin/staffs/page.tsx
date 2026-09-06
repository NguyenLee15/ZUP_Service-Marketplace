'use client';

import React from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AdminPermissionGuard } from '@/features/admin/components/AdminPermissionGuard';
import { useStaffsManagementFlow } from '@/features/admin/staffs/hooks/useStaffsManagementFlow';
import { StaffTable } from '@/features/admin/staffs/components/StaffTable';
import { StaffFormModal } from '@/features/admin/staffs/components/StaffFormModal';
import { StaffPermissionsModal } from '@/features/admin/staffs/components/StaffPermissionsModal';
import { StaffDeleteDialog } from '@/features/admin/staffs/components/StaffDeleteDialog';

export default function StaffsPage() {
  const {
    staffs,
    loading,
    keyword,
    setKeyword,
    meta,
    handleSearch,
    // Form modal
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
    // Permissions modal
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
  } = useStaffsManagementFlow();

  return (
    <AdminPermissionGuard adminOnly={true}>
      <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Quản Lý Nhân Viên
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {meta.total || staffs.length} nhân viên trong hệ thống • Phân quyền
              module chi tiết
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

        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Tìm theo họ tên, email nhân viên..."
              className="pl-10 h-10 rounded-xl bg-white border-slate-200 focus:border-slate-400"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleSearch}
            className="h-10 px-4 rounded-xl border-slate-200 hover:bg-slate-50 font-medium"
          >
            Tìm kiếm
          </Button>
        </div>

        {/* Staff Table Subcomponent */}
        <StaffTable
          staffs={staffs}
          loading={loading}
          permissionsLoading={permissionsLoading}
          permissionsError={permissionsError}
          onEdit={openEditModal}
          onOpenPerms={openPermModal}
          onToggleStatus={handleToggleStatus}
          onDelete={(staff) => setDeleteTarget(staff)}
        />

        {/* Create / Edit Modal Subcomponent */}
        <StaffFormModal
          isOpen={isModalOpen}
          editingStaff={editingStaff}
          formLoading={formLoading}
          formName={formName}
          setFormName={setFormName}
          formEmail={formEmail}
          setFormEmail={setFormEmail}
          formPhone={formPhone}
          setFormPhone={setFormPhone}
          formPassword={formPassword}
          setFormPassword={setFormPassword}
          formErrors={formErrors}
          validateField={validateField}
          onSubmit={handleSubmitForm}
          onClose={() => setIsModalOpen(false)}
        />

        {/* Permissions Matrix Modal Subcomponent */}
        <StaffPermissionsModal
          isOpen={permModalOpen}
          staff={permStaff}
          permState={permState}
          permSaving={permSaving}
          permissionGroups={permissionGroups}
          onTogglePerm={(key, value) =>
            setPermState((prev) => ({ ...prev, [key]: value }))
          }
          onToggleGroup={toggleGroupPermissions}
          onToggleAll={toggleAllPermissions}
          onSave={handleSavePermissions}
          onClose={() => setPermModalOpen(false)}
        />

        {/* Delete Confirmation Dialog Subcomponent */}
        <StaffDeleteDialog
          staff={deleteTarget}
          loading={deleteLoading}
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteTarget(null)}
        />
      </div>
    </AdminPermissionGuard>
  );
}
