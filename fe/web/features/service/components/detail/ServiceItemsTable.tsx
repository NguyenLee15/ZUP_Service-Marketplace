'use client';

import React from 'react';
import { Tag } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

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
          <Tag className="w-4 h-4 text-primary" />
          Bảng giá chi tiết từng hạng mục
        </h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <Table className="w-full text-left text-sm">
            <TableHeader>
              <TableRow className="bg-muted/40 border-b border-border">
                <TableHead className="p-3 font-semibold text-foreground">Tên hạng mục dịch vụ</TableHead>
                <TableHead className="p-3 font-semibold w-24 text-foreground">Đơn vị</TableHead>
                <TableHead className="p-3 font-semibold text-right w-32 text-foreground">Đơn giá</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item: ApiPayload) => (
                <TableRow
                  key={item.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="p-3 text-foreground font-medium">{item.name}</TableCell>
                  <TableCell className="p-3 text-muted-foreground">{item.unit}</TableCell>
                  <TableCell className="p-3 text-primary font-bold font-mono tabular-nums text-right">
                    {formatPrice(Number(item.price))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <Separator />
    </>
  );
}
