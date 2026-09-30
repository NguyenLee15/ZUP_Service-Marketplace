'use client';

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Loader2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type ServiceAction = 'approve' | 'reject' | 'hide' | 'show';

const statusConfig: Record<string, { label: string; color: string; icon: ApiPayload }> = {
  PENDING: { label: 'Chờ Duyệt', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  ACTIVE: { label: 'Đã Duyệt', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Từ Chối', color: 'bg-red-100 text-red-800', icon: XCircle },
  HIDDEN: { label: 'Đã Ẩn', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  DRAFT: { label: 'Nháp', color: 'bg-muted text-muted-foreground', icon: Clock },
};

interface AdminServicesTableProps {
  services: ApiPayload[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  togglingId: number | null;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onSelectService: (service: ApiPayload) => void;
  onConfirmAction: (action: ServiceAction, id: number) => void;
}

const formatPrice = (price: number) =>
  `${new Intl.NumberFormat('vi-VN').format(price)}₫`;

export function AdminServicesTable({
  services,
  loading,
  error,
  page,
  totalPages,
  togglingId,
  onRetry,
  onPageChange,
  onSelectService,
  onConfirmAction,
}: AdminServicesTableProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-12 rounded bg-muted animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
            <p className="text-sm text-slate-600 font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Thử lại
            </Button>
          </div>
        ) : services.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">Không có dịch vụ nào</p>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="text-left py-3 px-4 font-semibold text-xs uppercase text-slate-500">Tên Dịch Vụ</TableHead>
                <TableHead className="text-left py-3 px-4 font-semibold text-xs uppercase text-slate-500">Nhà Cung Cấp</TableHead>
                <TableHead className="text-left py-3 px-4 font-semibold text-xs uppercase text-slate-500">Giá từ</TableHead>
                <TableHead className="text-left py-3 px-4 font-semibold text-xs uppercase text-slate-500">Trạng Thái</TableHead>
                <TableHead className="text-left py-3 px-4 font-semibold text-xs uppercase text-slate-500">Rating</TableHead>
                <TableHead className="text-left py-3 px-4 font-semibold text-xs uppercase text-slate-500">Hành Động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service: ApiPayload) => {
                const config = statusConfig[service.status] || statusConfig.DRAFT;
                const StatusIcon = config.icon;
                return (
                  <TableRow key={service.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-foreground">{service.name}</p>
                          <p className="text-xs text-muted-foreground">{service.category?.name}</p>
                        </div>
                        {service.isSensitive && (
                          <Badge className="bg-rose-100 text-rose-700 border-0 hover:bg-rose-100/80 font-bold text-[10px] flex items-center gap-1 px-1.5 py-0.5 shrink-0 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Cần xem xét
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 px-4 text-gray-700">{service.provider?.fullName}</TableCell>
                    <TableCell className="py-3 px-4 font-medium text-foreground tabular-nums">
                      {formatPrice(Number(service.referencePrice))}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <Badge className={`${config.color} border-0 text-xs`}>
                        <StatusIcon className="w-3 h-3 mr-1" /> {config.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3 px-4 tabular-nums">
                      {Number(service.avgRating) > 0 ? (
                        <span className="font-medium">{Number(service.avgRating).toFixed(1)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectService(service)}
                          aria-label="Xem chi tiết dịch vụ"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                        {service.status === 'ACTIVE' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={togglingId === service.id}
                            onClick={() => onConfirmAction('hide', service.id)}
                            aria-label="Ẩn dịch vụ"
                            title="Ẩn dịch vụ"
                          >
                            {togglingId === service.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-orange-500" />
                            )}
                          </Button>
                        )}
                        {service.status === 'HIDDEN' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={togglingId === service.id}
                            onClick={() => onConfirmAction('show', service.id)}
                            aria-label="Mở ẩn dịch vụ"
                            title="Mở ẩn dịch vụ"
                          >
                            {togglingId === service.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {!loading && services.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Trang {page} / {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => onPageChange(page - 1)}>
                Trước
              </Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>
                Tiếp
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
