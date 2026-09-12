'use client';

import { useServiceStore } from '@/store/service.store';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, ArrowLeft, Scale, Wrench } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { getSafeServiceImageSrc } from '@/lib/security/image-sources';

export default function ComparePage() {
  const { comparisonList, removeFromComparison, clearComparison } = useServiceStore();

  return (
    <div className="w-full">
      <div className="py-8 max-w-7xl mx-auto w-full px-4 sm:px-6">
        <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold brand-heading mb-2">So sánh dịch vụ</h1>
            <p className="text-muted-foreground">
              So sánh chi tiết các tiêu chí để đưa ra lựa chọn phù hợp nhất
            </p>
          </div>
          
          <div className="flex gap-3">
            <Link href="/services">
              <Button variant="outline" className="flex gap-2">
                <ArrowLeft className="w-4 h-4" />
                Tiếp tục tìm kiếm
              </Button>
            </Link>
            {comparisonList.length > 0 && (
              <Button variant="destructive" onClick={clearComparison} className="flex gap-2">
                <X className="w-4 h-4" />
                Xóa tất cả
              </Button>
            )}
          </div>
        </div>

        {comparisonList.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Chưa có dịch vụ nào để so sánh</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-6 text-sm">
              Bạn chưa thêm dịch vụ nào vào danh sách so sánh. Hãy quay lại danh mục dịch vụ và thêm dịch vụ bạn quan tâm.
            </p>
            <Link href="/services">
              <Button className="rounded-lg px-6 font-medium">
                Tìm kiếm dịch vụ
              </Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden overflow-x-auto shadow-sm">
            <Table className="w-full text-left">
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="p-6 border-r border-border bg-muted/30 w-64 shrink-0 align-bottom font-bold text-foreground">
                    Tính năng / Tiêu chí
                  </TableHead>
                  {comparisonList.map((service) => (
                    <TableHead key={service.id} className="p-6 border-r border-border min-w-[300px] relative group bg-card align-top">
                      <button 
                        onClick={() => removeFromComparison(service.id)}
                        className="absolute top-4 right-4 w-8 h-8 bg-muted text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="Xóa khỏi so sánh"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      <div className="flex flex-col gap-4">
                        <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                          {service.images?.[0]?.imageUrl ? (
                            <Image src={getSafeServiceImageSrc(service.images[0].imageUrl, service)} alt={service.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Wrench className="w-8 h-8 opacity-40" />
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <Badge variant="secondary" className="mb-2">
                            {service.category?.name || 'Dịch vụ'}
                          </Badge>
                          <h3 className="text-lg font-bold text-foreground line-clamp-2 mb-1">{service.name}</h3>
                          <p className="text-muted-foreground text-xs">Cung cấp bởi: {service.provider?.fullName}</p>
                        </div>
                        
                        <div className="mt-auto pt-2">
                          <Link href={`/services/${service.id}`} className="block w-full">
                            <Button className="w-full">
                              Xem chi tiết
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </TableHead>
                  ))}
                  {/* Empty slots placeholders */}
                  {Array.from({ length: Math.max(0, 3 - comparisonList.length) }).map((_, i) => (
                    <TableHead key={`empty-${i}`} className="p-6 border-r border-border min-w-[300px] bg-muted/10 align-middle">
                      <Link
                        href="/services"
                        className="group h-full min-h-[260px] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <div className="w-12 h-12 rounded-full bg-muted border border-border flex items-center justify-center text-xl shadow-sm mb-3 text-primary">
                          +
                        </div>
                        <p className="font-medium text-foreground group-hover:text-primary text-sm">Thêm dịch vụ</p>
                        <span className="mt-1 text-xs text-muted-foreground">
                          Quay lại danh sách để chọn thêm
                        </span>
                      </Link>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Giá tham khảo */}
                <TableRow className="border-b border-border">
                  <TableCell className="p-6 border-r border-border bg-muted/30 font-medium text-muted-foreground">Giá tham khảo</TableCell>
                  {comparisonList.map((service) => (
                    <TableCell key={service.id} className="p-6 border-r border-border">
                      <p className="text-xl font-bold font-mono tabular-nums text-primary">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(service.referencePrice))}
                      </p>
                    </TableCell>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - comparisonList.length) }).map((_, i) => (
                    <TableCell key={`empty-price-${i}`} className="p-6 border-r border-border bg-muted/10"></TableCell>
                  ))}
                </TableRow>
                
                {/* Đánh giá */}
                <TableRow className="border-b border-border">
                  <TableCell className="p-6 border-r border-border bg-muted/30 font-medium text-muted-foreground">Đánh giá</TableCell>
                  {comparisonList.map((service) => (
                    <TableCell key={service.id} className="p-6 border-r border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 text-lg">★</span>
                        <span className="font-bold text-foreground font-mono tabular-nums">{service.avgRating ? Number(service.avgRating).toFixed(1) : 'Chưa có'}</span>
                        <span className="text-muted-foreground text-xs">({service.totalReviews || 0} nhận xét)</span>
                      </div>
                    </TableCell>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - comparisonList.length) }).map((_, i) => (
                    <TableCell key={`empty-rating-${i}`} className="p-6 border-r border-border bg-muted/10"></TableCell>
                  ))}
                </TableRow>
                
                {/* Trạng thái hoạt động */}
                <TableRow className="border-b border-border">
                  <TableCell className="p-6 border-r border-border bg-muted/30 font-medium text-muted-foreground">Trạng thái</TableCell>
                  {comparisonList.map((service) => (
                    <TableCell key={service.id} className="p-6 border-r border-border">
                      <div className="flex items-center gap-2">
                        {service.status === 'ACTIVE' ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-medium text-emerald-600 text-sm">Đang hoạt động</span>
                          </>
                        ) : (
                          <span className="font-medium text-muted-foreground text-sm">Ngừng hoạt động</span>
                        )}
                      </div>
                    </TableCell>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - comparisonList.length) }).map((_, i) => (
                    <TableCell key={`empty-jobs-${i}`} className="p-6 border-r border-border bg-muted/10"></TableCell>
                  ))}
                </TableRow>
                
                {/* Mô tả ngắn */}
                <TableRow>
                  <TableCell className="p-6 border-r border-border bg-muted/30 font-medium text-muted-foreground align-top">Mô tả</TableCell>
                  {comparisonList.map((service) => (
                    <TableCell key={service.id} className="p-6 border-r border-border align-top">
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-4">
                        {service.description || 'Không có mô tả chi tiết cho dịch vụ này.'}
                      </p>
                    </TableCell>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - comparisonList.length) }).map((_, i) => (
                    <TableCell key={`empty-desc-${i}`} className="p-6 border-r border-border bg-muted/10"></TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
