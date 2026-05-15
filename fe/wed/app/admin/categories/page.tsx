'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';
import { serviceApi } from '@/features/service/services/service.api';
import { adminApi } from '@/features/auth/services/api';

const categorySchema = z.object({
  name: z.string().min(2, 'Tên danh mục phải có ít nhất 2 ký tự'),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  isExpanded?: boolean;
  children?: Category[];
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedParentId, setSelectedParentId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    mode: 'onChange',
  });

  const fetchCategories = () => {
    setLoading(true);
    serviceApi.getCategories()
      .then((res) => {
        // Mặc định expand level 1
        const addExpand = (cats: any[]): Category[] => {
          return cats.map((c) => ({
            ...c,
            isExpanded: c.parentId === null,
            children: c.children ? addExpand(c.children) : []
          }));
        };
        setCategories(addExpand(res.data.data || []));
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const toggleExpand = (id: number) => {
    const updateCategories = (cats: Category[]): Category[] => {
      return cats.map((cat) => {
        if (cat.id === id) {
          return { ...cat, isExpanded: !cat.isExpanded };
        }
        if (cat.children) {
          return { ...cat, children: updateCategories(cat.children) };
        }
        return cat;
      });
    };
    setCategories(updateCategories(categories));
  };

  const onSubmit = async (data: CategoryFormData) => {
    setActionLoading(true);
    try {
      if (editingId) {
        await adminApi.updateCategory(editingId, data);
        toast({ title: 'Đã cập nhật danh mục' });
      } else {
        await adminApi.createCategory({ ...data, parentId: selectedParentId });
        toast({ title: 'Đã thêm danh mục mới' });
      }
      setIsModalOpen(false);
      reset();
      setEditingId(null);
      setSelectedParentId(null);
      fetchCategories();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message || 'Có lỗi xảy ra', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      await adminApi.deleteCategory(id);
      toast({ title: 'Đã xóa danh mục' });
      fetchCategories();
    } catch (err: any) {
      toast({ title: 'Lỗi', description: err.response?.data?.error?.message || 'Có lỗi xảy ra', variant: 'destructive' });
    }
  };

  const renderCategory = (category: Category, depth: number = 0): React.ReactNode => {
    const hasChildren = category.children && category.children.length > 0;
    const level = depth + 1;

    return (
      <div key={category.id}>
        <div className="flex items-center gap-2 p-3 hover:bg-muted rounded-lg group">
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(category.id)}
              className="p-1 hover:bg-muted rounded transition-colors"
            >
              {category.isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded font-medium ${level === 1 ? 'bg-blue-100 text-blue-800' : level === 2 ? 'bg-green-100 text-green-800' : 'bg-muted text-foreground'}`}>
                Level {level}
              </span>
              <span className="font-medium text-foreground">{category.name}</span>
            </div>
            {category.description && <p className="text-sm text-muted-foreground mt-0.5">{category.description}</p>}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {level < 3 && (
              <Button
                variant="ghost"
                size="sm"
                title="Thêm danh mục con"
                onClick={() => {
                  setEditingId(null);
                  setSelectedParentId(category.id);
                  reset({ name: '', description: '' });
                  setIsModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4 text-green-600" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              title="Chỉnh sửa"
              onClick={() => {
                setEditingId(category.id);
                setSelectedParentId(category.parentId);
                setValue('name', category.name);
                setValue('description', category.description || '');
                setIsModalOpen(true);
              }}
            >
              <Edit2 className="w-4 h-4 text-blue-600" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" title="Xóa" onClick={() => handleDelete(category.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {hasChildren && category.isExpanded && (
          <div className="ml-4 border-l-2 border-border pl-2">
            {category.children!.map((child) => renderCategory(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-foreground">Quản Lý Danh Mục</h3>
          <p className="text-muted-foreground mt-1">Cấu trúc 3 cấp độ: Chính → Phụ → Chi tiết</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setSelectedParentId(null);
            reset({ name: '', description: '' });
            setIsModalOpen(true);
          }}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Thêm Danh Mục Gốc
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : categories.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Chưa có danh mục nào</p>
          ) : (
            <div className="space-y-2">{categories.map((cat) => renderCategory(cat))}</div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4 mb-4">
              <CardTitle>{editingId ? 'Chỉnh Sửa' : 'Thêm'} Danh Mục {selectedParentId ? 'Con' : 'Gốc'}</CardTitle>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  reset();
                  setEditingId(null);
                  setSelectedParentId(null);
                }}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Tên Danh Mục
                  </label>
                  <Input
                    placeholder="Nhập tên danh mục"
                    {...register('name')}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1">
                    Mô Tả
                  </label>
                  <textarea
                    placeholder="Nhập mô tả danh mục..."
                    {...register('description')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsModalOpen(false);
                      reset();
                      setEditingId(null);
                      setSelectedParentId(null);
                    }}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={actionLoading} className="bg-blue-600 hover:bg-blue-700">
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
