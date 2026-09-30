'use client';

import {
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ServiceAction } from './AdminServicesTable';

interface AdminServiceDetailDialogProps {
  service: ApiPayload;
  open: boolean;
  rejectReason: string;
  actionLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onRejectReasonChange: (reason: string) => void;
  onConfirmAction: (action: ServiceAction, id: number) => void;
}

const formatPrice = (price: number) =>
  `${new Intl.NumberFormat('vi-VN').format(price)}₫`;

export function AdminServiceDetailDialog({
  service,
  open,
  rejectReason,
  actionLoading,
  onOpenChange,
  onRejectReasonChange,
  onConfirmAction,
}: AdminServiceDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {service && (
          <>
            <DialogHeader>
              <DialogTitle>{service.name}</DialogTitle>
              <DialogDescription>Chi tiết dịch vụ và thông tin nhà cung cấp</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              {service.isSensitive && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 text-sm text-rose-800">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-bold">Nội Dung Cần Lưu Ý (Kiểm Duyệt Tự Động)</h5>
                    <p className="text-xs text-rose-600 mt-1 leading-relaxed">
                      Hệ thống kiểm duyệt tự động phát hiện dịch vụ này chứa từ khóa cần xác minh theo quy chuẩn ZUP. Vui lòng rà soát kỹ lưỡng trước khi phê duyệt.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Nhà Cung Cấp</p>
                  <p className="font-medium">{service.provider?.fullName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Giá từ</p>
                  <p className="font-medium tabular-nums">{formatPrice(Number(service.referencePrice))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Danh Mục</p>
                  <p className="font-medium">{service.category?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ngày Tạo</p>
                  <p className="font-medium tabular-nums">
                    {service.createdAt ? new Date(service.createdAt).toLocaleDateString('vi-VN') : '—'}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Mô Tả</p>
                <p className="text-sm text-foreground/80 whitespace-pre-line">{service.description}</p>
              </div>

              {service.images?.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Hình Ảnh</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {service.images.map((image: { id: number; imageUrl: string }) => (
                      <img key={image.id} src={image.imageUrl} alt="service image" className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
                    ))}
                  </div>
                </div>
              )}

              {service.items?.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Các Hạng Mục Dịch Vụ</p>
                  <div className="bg-muted p-3 rounded-lg space-y-2">
                    {service.items.map((item: { id: number; name: string; price: number | string }) => (
                      <div key={item.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 border-gray-200">
                        <span>{item.name}</span>
                        <span className="font-medium tabular-nums">{formatPrice(Number(item.price))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {service.status === 'PENDING' && (
                <div className="space-y-3 border-t pt-4">
                  <Textarea
                    value={rejectReason}
                    onChange={(event) => onRejectReasonChange(event.target.value)}
                    placeholder="Lý do từ chối (nếu từ chối)..."
                    rows={2}
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Đóng
                </Button>
                {service.status === 'PENDING' && (
                  <>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      disabled={actionLoading}
                      onClick={() => onConfirmAction('approve', service.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" /> Duyệt
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={!rejectReason || actionLoading}
                      onClick={() => onConfirmAction('reject', service.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" /> Từ Chối
                    </Button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
