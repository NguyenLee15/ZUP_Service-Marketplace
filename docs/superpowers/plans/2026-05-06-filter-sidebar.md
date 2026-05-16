# [Filter Sidebar] Implementation Plan

**Goal:** Thay thế bộ lọc cũ bằng Sidebar bên trái chuyên nghiệp (giống mẫu bất động sản) cho trang danh sách dịch vụ, tích hợp lọc theo Giá, Đánh giá, và Danh mục.

**Architecture:** Sử dụng Grid layout (col-span-3 cho Sidebar, col-span-9 cho Content) trên Desktop. Tách logic lọc thành component `ServiceFilterSidebar` riêng để dễ quản lý state.

**Tech Stack:** Next.js 16.2, Tailwind CSS, Lucide Icons, Shadcn UI (Slider, Checkbox, Badge).

---

### Task 1: Khởi tạo Component ServiceFilterSidebar

**Files:**
- [NEW] `fe/wed/app/components/services/ServiceFilterSidebar.tsx`
- [MODIFY] `fe/wed/app/(main)/services/page.tsx`

- [ ] **Bước 1: Tạo cấu trúc Sidebar theo mẫu ảnh**

```tsx
// fe/wed/app/components/services/ServiceFilterSidebar.tsx
import { Search, MapPin, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';

export function ServiceFilterSidebar({ filters, setFilters, onApply, categories }) {
  return (
    <aside className="space-y-8 p-6 bg-card border border-border rounded-2xl shadow-sm sticky top-24">
      <div>
        <div className="flex items-center gap-2 mb-6">
          <Search className="w-5 h-5 text-purple-600" />
          <h2 className="font-bold text-lg text-foreground">Bộ lọc tìm kiếm</h2>
        </div>

        {/* Danh mục */}
        <div className="space-y-4 mb-8">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Loại Dịch Vụ</h3>
          <div className="space-y-3">
            {categories.slice(0, 5).map(cat => (
              <div key={cat.id} className="flex items-center space-x-2">
                <Checkbox id={`cat-${cat.id}`} />
                <label htmlFor={`cat-${cat.id}`} className="text-sm font-medium leading-none cursor-pointer">{cat.name}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Khoảng giá */}
        <div className="space-y-4 mb-8">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Khoảng Giá</h3>
          <div className="flex items-center gap-2">
            <Input placeholder="Từ (triệu)" className="h-9 text-xs" />
            <span className="text-muted-foreground">-</span>
            <Input placeholder="Đến (triệu)" className="h-9 text-xs" />
          </div>
        </div>

        {/* Đánh giá */}
        <div className="space-y-4 mb-8">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Đánh giá</h3>
          {[5, 4, 3].map(star => (
            <div key={star} className="flex items-center space-x-2">
              <Checkbox id={`star-${star}`} />
              <label htmlFor={`star-${star}`} className="flex items-center gap-1 cursor-pointer">
                {[...Array(star)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                <span className="text-xs text-muted-foreground">trở lên</span>
              </label>
            </div>
          ))}
        </div>

        <Button className="w-full bg-foreground text-background hover:bg-foreground/90 font-bold py-6 rounded-xl transition-all active:scale-95">
          Áp dụng bộ lọc
        </Button>
      </div>
    </aside>
  );
}
```

### Task 2: Cập nhật Layout trang /services

**Files:**
- [MODIFY] `fe/wed/app/(main)/services/page.tsx`

- [ ] **Bước 1: Chuyển đổi sang Grid Layout**

```tsx
// fe/wed/app/(main)/services/page.tsx
return (
  <div className="min-h-screen bg-background">
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar - Chiếm 3 cột trên desktop */}
        <div className="hidden lg:block lg:col-span-3">
          <ServiceFilterSidebar 
            categories={categories}
            // ... props
          />
        </div>

        {/* Content - Chiếm 9 cột */}
        <div className="lg:col-span-9">
           {/* Header kết quả + Grid dịch vụ cũ */}
        </div>
      </div>
    </div>
  </div>
)
```

### Task 3: Kết nối Logic lọc và Mobile Responsive

- [ ] **Bước 1: Đồng bộ State Sidebar với URL Search Params**
- [ ] **Bước 2: Sử dụng Sheet (Shadcn UI) để hiển thị Sidebar dưới dạng Drawer trên Mobile**
