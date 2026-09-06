'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminForbiddenStateProps {
  requiredPermissionLabel?: string;
  defaultRoute?: string;
}

export function AdminForbiddenState({
  requiredPermissionLabel,
  defaultRoute = '/admin',
}: AdminForbiddenStateProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50 shadow-sm">
        <ShieldAlert className="h-10 w-10 stroke-[1.75]" />
      </div>

      <span className="mt-6 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 font-mono text-xs font-semibold text-amber-800">
        403 FORBIDDEN
      </span>

      <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        Từ chối quyền truy cập
      </h2>

      <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
        Tài khoản của bạn chưa được cấp quyền truy cập tính năng này.
        {requiredPermissionLabel && (
          <span className="mt-1 block font-medium text-amber-700">
            Yêu cầu quyền: {requiredPermissionLabel}
          </span>
        )}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="outline"
          className="gap-2 border-slate-300 hover:bg-slate-50"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại trang trước
        </Button>

        <Button asChild className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
          <Link href={defaultRoute}>
            <Home className="h-4 w-4" />
            Về màn hình chính
          </Link>
        </Button>
      </div>
    </div>
  );
}

