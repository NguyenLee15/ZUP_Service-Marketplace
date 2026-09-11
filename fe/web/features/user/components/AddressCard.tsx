'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2 } from 'lucide-react';
import { formatAdministrativeArea } from '@/lib/address-options';
import { Address } from '../hooks/useAddressManagementFlow';

interface AddressCardProps {
  address: Address;
  actionId: number | null;
  onSetDefault: (id: number) => void;
  onDelete: (id: number) => void;
}

export function AddressCard({
  address,
  actionId,
  onSetDefault,
  onDelete,
}: AddressCardProps) {
  const isBusy = actionId === address.id;

  return (
    <Card className="surface-card rounded-[20px] p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-foreground">
              {address.label || 'Địa chỉ'}
            </h3>
            {address.isDefault && (
              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                Mặc định
              </span>
            )}
          </div>
          <p className="text-sm text-foreground">{address.addressDetail}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatAdministrativeArea(
              address.province,
              address.ward,
              address.district,
            )}
          </p>
          {address.latitude != null &&
            address.longitude != null &&
            (Number(address.latitude) !== 0 ||
              Number(address.longitude) !== 0) && (
              <p className="mt-2 text-[11px] text-muted-foreground">
                Tọa độ: {Number(address.latitude).toFixed(4)},{' '}
                {Number(address.longitude).toFixed(4)}
              </p>
            )}
        </div>

        <div className="flex items-center gap-2 sm:flex-shrink-0">
          {!address.isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetDefault(address.id)}
              disabled={isBusy}
              className="text-xs"
            >
              {isBusy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Đặt mặc định'
              )}
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(address.id)}
            disabled={isBusy}
            aria-label="Xóa địa chỉ"
            className="text-xs"
          >
            {isBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

