'use client';

import React from 'react';
import { Diamond } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ServiceItemsTableProps {
  items: ApiPayload[];
  formatPrice: (price: number) => string;
}

export function ServiceItemsTable({
  items,
  formatPrice,
}: ServiceItemsTableProps) {
  if (!items || items.length === 0) return null;

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
          <Diamond className="w-4 h-4 text-action-blue fill-action-blue/20" />
          Bảng giá chi tiết từng hạng mục
        </h2>
        <div className="rounded-[16px] border border-white/10 bg-white/5 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-white/10 text-slate-200 border-b border-white/10">
                <th className="p-3 font-semibold">Tên hạng mục dịch vụ</th>
                <th className="p-3 font-semibold w-24">Đơn vị</th>
                <th className="p-3 font-semibold text-right w-32">Đơn giá</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item: ApiPayload) => (
                <tr
                  key={item.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="p-3 text-slate-100 font-medium">{item.name}</td>
                  <td className="p-3 text-slate-300">{item.unit}</td>
                  <td className="p-3 text-action-blue font-bold text-right">
                    {formatPrice(Number(item.price))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Separator />
    </>
  );
}

