"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Loader2, AlertCircle, FolderTree } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/use-toast";
import { adminApi } from "@/features/admin/services/admin.api";
import { AdminPermissionGuard } from "@/features/admin/components/AdminPermissionGuard";
import { AdminPermission } from "@/types/admin-permissions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categorySchema = z.object({
  name: z.string().min(2, "Tên danh mục phải có ít nhất 2 ký tự"),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  id: number;
  name: string;
  description: string | null;
  parentId?: number | null;
  children?: Category[];
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    mode: "onChange",
  });

  const fetchCategories = useCallback(() => {
    setLoading(true);
    adminApi
      .getCategories()
      .then((res) => {
        setCategories(res.data?.data || []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    reset({ name: "", description: "" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setValue("name", category.name);
    setValue("description", category.description || "");
    setIsModalOpen(true);
  };

  const onSubmit = async (data: CategoryFormData) => {
    setActionLoading(true);
    try {
      if (editingCategory) {
        await adminApi.updateCategory(editingCategory.id, data);
        toast({ title: "Đã cập nhật danh mục thành công" });
      } else {
        await adminApi.createCategory(data);
        toast({ title: "Đã thêm danh mục mới thành công" });
      }
      setIsModalOpen(false);
      reset();
      setEditingCategory(null);
      fetchCategories();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Có lỗi xảy ra khi lưu danh mục";
      toast({
        title: "Lỗi",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setActionLoading(true);
    try {
      await adminApi.deleteCategory(deletingId);
      toast({ title: "Đã xóa danh mục thành công" });
      setDeletingId(null);
      fetchCategories();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Không thể xóa danh mục";
      toast({
        title: "Lỗi",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const renderCategoryItem = (category: Category) => (
    <div
      key={category.id}
      className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-blue-50 p-2 text-blue-600">
          <FolderTree className="h-4 w-4" />
        </div>
        <div>
          <h4 className="font-semibold text-slate-900 text-sm">{category.name}</h4>
          {category.description ? (
            <p className="text-xs text-slate-500 mt-0.5">{category.description}</p>
          ) : (
            <p className="text-xs text-slate-400 italic mt-0.5">Chưa có mô tả</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
          title="Chỉnh sửa"
          onClick={() => handleOpenEdit(category)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-slate-600 hover:text-red-600 hover:bg-red-50"
          title="Xóa"
          onClick={() => setDeletingId(category.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <AdminPermissionGuard permission={AdminPermission.SERVICE_MODERATE}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Quản Lý Danh Mục</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Quản lý danh sách danh mục dịch vụ trong hệ thống
            </p>
          </div>
          <Button onClick={handleOpenAdd} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4" />
            Thêm Danh Mục
          </Button>
        </div>

        {/* Categories Card */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-bold text-slate-800">
              Danh sách danh mục ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <p className="text-sm">Đang tải danh mục...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                <AlertCircle className="h-10 w-10 text-slate-400 mb-2" />
                <p className="font-semibold text-sm">Chưa có danh mục nào</p>
                <p className="text-xs text-slate-400 mt-1">
                  Nhấn nút &ldquo;Thêm Danh Mục&rdquo; để khởi tạo danh mục đầu tiên
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {categories.map((category) => renderCategoryItem(category))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Chỉnh Sửa Danh Mục" : "Thêm Danh Mục Mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Tên danh mục *</label>
              <Input
                {...register("name")}
                placeholder="Ví dụ: Sửa chữa điện nước"
                className="mt-1.5"
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Mô tả</label>
              <Textarea
                {...register("description")}
                placeholder="Mô tả chi tiết về danh mục dịch vụ này..."
                className="mt-1.5 min-h-[90px]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={actionLoading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingCategory ? "Lưu Thay Đổi" : "Tạo Mới"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa danh mục</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa danh mục này? Thao tác này không thể hoàn tác nếu danh mục đã chứa dịch vụ liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xác nhận xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPermissionGuard>
  );
}
