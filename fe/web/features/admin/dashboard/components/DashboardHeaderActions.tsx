'use client';

import React from 'react';
import { RefreshCw, Download, ChevronDown, FileText, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardHeaderActionsProps {
  loading: boolean;
  isExporting: boolean;
  onRefresh: () => void;
  onExport: (type: 'pdf' | 'excel') => void;
}

export function DashboardHeaderActions({
  loading,
  isExporting,
  onRefresh,
  onExport,
}: DashboardHeaderActionsProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={onRefresh}
          variant="outline"
          size="icon"
          className="rounded-lg border-platinum-tint bg-white text-slate-blue transition-colors hover:bg-pale-gray dark:border-gray-800 dark:bg-gray-900"
          aria-label="Làm mới dữ liệu dashboard"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? 'animate-spin text-action-blue' : ''}`}
          />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isExporting}
              className="gap-2 rounded-lg border-platinum-tint bg-white text-midnight-indigo shadow-[var(--brand-shadow-sm)] transition-colors hover:bg-pale-gray dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            >
              <Download className="h-4 w-4" />
              <span>Xuất báo cáo</span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-lg">
            <DropdownMenuItem
              onClick={() => onExport('pdf')}
              className="cursor-pointer gap-2"
            >
              <FileText className="h-4 w-4 text-red-500" />
              Xuất file PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onExport('excel')}
              className="cursor-pointer gap-2"
            >
              <Table className="h-4 w-4 text-emerald-600" />
              Xuất file Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

