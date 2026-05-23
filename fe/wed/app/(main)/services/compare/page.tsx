'use client';

import { useServiceStore } from '@/store/service.store';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function ComparePage() {
  const { comparisonList, removeFromComparison, clearComparison } = useServiceStore();

  return (
    <div className="w-full">
      <div className="py-8 max-w-7xl mx-auto w-full">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold brand-heading mb-2">So sánh dịch vụ</h1>
            <p className="text-muted-foreground">
              So sánh chi tiết để tìm ra thợ phù hợp nhất với nhu cầu của bạn
            </p>
          </div>
          
          <div className="flex gap-4">
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
          <div className="glass-panel rounded-[20px] p-12 text-center shadow-xl animate-in fade-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-white/5 border border-white/10 text-action-blue rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-md">
              ⚖️
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Chưa có dịch vụ nào</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Bạn chưa thêm dịch vụ nào vào danh sách so sánh. Hãy quay lại trang tìm kiếm và thêm các dịch vụ bạn quan tâm.
            </p>
            <Link href="/services">
              <Button className="bg-action-blue hover:bg-glacier-blue text-white rounded-xl px-8 h-12 font-bold shadow-[var(--brand-shadow-button)]">
                Tìm kiếm dịch vụ
              </Button>
            </Link>
          </div>
        ) : (
          <div className="glass-panel rounded-[20px] overflow-hidden overflow-x-auto shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="p-6 border-b border-r border-white/10 bg-white/5 w-64 shrink-0 align-bottom">
                    <p className="font-bold text-slate-900 dark:text-white">Tính năng / Tiêu chí</p>
                  </th>
                  {comparisonList.map((service) => (
                    <th key={service.id} className="p-6 border-b border-r border-white/10 min-w-[300px] relative group bg-white/10 backdrop-blur-md">
                      <button 
                        onClick={() => removeFromComparison(service.id)}
                        className="absolute top-4 right-4 w-8 h-8 bg-red-50 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-blue"
                        aria-label="Xóa khỏi so sánh"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      <div className="flex flex-col gap-4">
                        <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-pale-gray">
                          {service.images?.[0]?.imageUrl ? (
                            <Image src={service.images[0].imageUrl} alt={service.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">🛠️</div>
                          )}
                        </div>
                        
                        <div>
                          <Badge variant="secondary" className="bg-pale-gray text-action-blue border-0 mb-2">
                            {service.category?.name || 'Dịch vụ'}
                          </Badge>
                          <h3 className="text-xl font-bold text-foreground line-clamp-2 mb-1">{service.name}</h3>
                          <p className="text-muted-foreground text-sm">Cung cấp bởi: {service.provider?.fullName}</p>
                        </div>
                        
                        <div className="mt-auto">
                          <Link href={`/services/${service.id}`} className="block w-full">
                            <Button className="w-full bg-action-blue hover:bg-glacier-blue text-white shadow-[var(--brand-shadow-button)]">
                              Xem chi tiết
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </th>
                  ))}
                  {/* Empty slots placeholders */}
                  {Array.from({ length: Math.max(0, 3 - comparisonList.length) }).map((_, i) => (
                    <th key={`empty-${i}`} className="p-6 border-b border-r border-white/10 min-w-[300px] bg-slate-900/10">
                      <div className="h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-2xl text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-sm mb-4 text-sky-400">
                          +
                        </div>
                        <p className="font-medium">Thêm dịch vụ</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Giá tham khảo */}
                <tr>
                  <td className="p-6 border-b border-r border-white/10 bg-white/5 font-medium text-slate-400">Giá tham khảo</td>
                  {comparisonList.map((service) => (
                    <td key={service.id} className="p-6 border-b border-r border-white/10">
                      <p className="text-xl font-bold text-sky-400">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(service.referencePrice))}
                      </p>
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - comparisonList.length) }).map((_, i) => (
                    <td key={`empty-price-${i}`} className="p-6 border-b border-r border-white/10 bg-slate-900/10"></td>
                  ))}
                </tr>
                
                {/* Đánh giá */}
                <tr>
                  <td className="p-6 border-b border-r border-white/10 bg-white/5 font-medium text-slate-400">Đánh giá</td>
                  {comparisonList.map((service) => (
                    <td key={service.id} className="p-6 border-b border-r border-white/10">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500 text-xl">★</span>
                        <span className="font-bold text-slate-900 dark:text-white">{service.avgRating ? Number(service.avgRating).toFixed(1) : 'Chưa có'}</span>
                        <span className="text-slate-400 text-sm">({service.totalReviews || 0} nhận xét)</span>
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - comparisonList.length) }).map((_, i) => (
                    <td key={`empty-rating-${i}`} className="p-6 border-b border-r border-white/10 bg-slate-900/10"></td>
                  ))}
                </tr>
                
                {/* Trạng thái hoạt động */}
                <tr>
                  <td className="p-6 border-b border-r border-white/10 bg-white/5 font-medium text-slate-400">Trạng thái</td>
                  {comparisonList.map((service) => (
                    <td key={service.id} className="p-6 border-b border-r border-white/10">
                      <div className="flex items-center gap-2 text-slate-200">
                        {service.status === 'ACTIVE' ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            <span className="font-bold text-green-400">Đang hoạt động</span>
                          </>
                        ) : (
                          <span className="font-bold text-slate-400">Ngừng hoạt động</span>
                        )}
                      </div>
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - comparisonList.length) }).map((_, i) => (
                    <td key={`empty-jobs-${i}`} className="p-6 border-b border-r border-white/10 bg-slate-900/10"></td>
                  ))}
                </tr>
                
                {/* Mô tả ngắn */}
                <tr>
                  <td className="p-6 border-r border-white/10 bg-white/5 font-medium text-slate-400 align-top">Mô tả</td>
                  {comparisonList.map((service) => (
                    <td key={service.id} className="p-6 border-r border-white/10 align-top">
                      <p className="text-slate-400 text-sm leading-relaxed line-clamp-4">
                        {service.description || 'Không có mô tả chi tiết cho dịch vụ này.'}
                      </p>
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, 3 - comparisonList.length) }).map((_, i) => (
                    <td key={`empty-desc-${i}`} className="p-6 border-r border-white/10 bg-slate-900/10"></td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
