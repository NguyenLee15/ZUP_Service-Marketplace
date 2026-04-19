'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const categorySchema = z.object({
  name: z.string().min(2, 'Tên danh mục phải có ít nhất 2 ký tự'),
  description: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  description: string;
  level: 1 | 2 | 3;
  parentId?: string;
  isExpanded?: boolean;
  children?: Category[];
}

const mockCategories: Category[] = [
  {
    id: '1',
    name: 'Dịch Vụ Kỹ Thuật',
    description: 'Các dịch vụ liên quan đến công nghệ',
    level: 1,
    isExpanded: true,
    children: [
      {
        id: '1-1',
        name: 'Phát Triển Web',
        description: 'Thiết kế và phát triển website',
        level: 2,
        parentId: '1',
        isExpanded: true,
        children: [
          {
            id: '1-1-1',
            name: 'Frontend Development',
            description: 'Lập trình giao diện',
            level: 3,
            parentId: '1-1',
          },
          {
            id: '1-1-2',
            name: 'Backend Development',
            description: 'Lập trình phía máy chủ',
            level: 3,
            parentId: '1-1',
          },
        ],
      },
      {
        id: '1-2',
        name: 'Mobile App',
        description: 'Phát triển ứng dụng di động',
        level: 2,
        parentId: '1',
      },
    ],
  },
  {
    id: '2',
    name: 'Dịch Vụ Marketing',
    description: 'Các dịch vụ quảng bá và tiếp thị',
    level: 1,
    isExpanded: false,
    children: [
      {
        id: '2-1',
        name: 'SEO',
        description: 'Tối ưu công cụ tìm kiếm',
        level: 2,
        parentId: '2',
      },
      {
        id: '2-2',
        name: 'Social Media Marketing',
        description: 'Quảng bá trên mạng xã hội',
        level: 2,
        parentId: '2',
      },
    ],
  },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    mode: 'onChange',
  });

  const toggleExpand = (id: string) => {
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

  const onSubmit = (data: CategoryFormData) => {
    // Mock submit
    console.log('Form data:', data);
    setIsModalOpen(false);
    reset();
    setEditingId(null);
    setSelectedParent(null);
  };

  const renderCategory = (category: Category, depth: number = 0): React.ReactNode => {
    const hasChildren = category.children && category.children.length > 0;

    return (
      <div key={category.id}>
        <div className="flex items-center gap-2 p-3 hover:bg-gray-50 rounded-lg group">
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(category.id)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
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
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-medium">
                Level {category.level}
              </span>
              <span className="font-medium text-gray-900">{category.name}</span>
            </div>
            <p className="text-sm text-gray-600">{category.description}</p>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingId(category.id);
                setIsModalOpen(true);
              }}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {hasChildren && category.isExpanded && (
          <div className="ml-4 border-l-2 border-gray-200 pl-2">
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
          <h3 className="text-2xl font-bold text-gray-900">Quản Lý Danh Mục</h3>
          <p className="text-gray-600 mt-1">Cấu trúc 3 cấp độ: Chính → Phụ → Chi tiết</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setSelectedParent(null);
            setIsModalOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm Danh Mục
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">{categories.map((cat) => renderCategory(cat))}</div>
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingId ? 'Chỉnh Sửa' : 'Thêm'} Danh Mục</CardTitle>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô Tả
                  </label>
                  <textarea
                    placeholder="Nhập mô tả danh mục"
                    {...register('description')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
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
