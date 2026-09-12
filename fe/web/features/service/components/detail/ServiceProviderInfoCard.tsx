'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Phone, MessageSquare } from 'lucide-react';

interface ServiceProviderInfoCardProps {
  provider: ApiPayload;
  isAuthenticated: boolean;
  chatLoading: boolean;
  onStartChat: () => void;
}

export function ServiceProviderInfoCard({
  provider,
  isAuthenticated,
  chatLoading,
  onStartChat,
}: ServiceProviderInfoCardProps) {
  return (
    <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs py-0">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4 text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-3">
          {provider?.id ? (
            <Link
              href={`/providers/${provider.id}`}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-action-blue flex items-center justify-center text-white text-xl font-bold shrink-0 hover:opacity-90 transition-opacity"
            >
              {provider?.fullName?.charAt(0)}
            </Link>
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-action-blue flex items-center justify-center text-white text-xl font-bold shrink-0">
              {provider?.fullName?.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {provider?.id ? (
                <Link
                  href={`/providers/${provider.id}`}
                  className="font-bold text-foreground text-base sm:text-lg hover:text-action-blue hover:underline transition-colors truncate"
                >
                  {provider?.fullName}
                </Link>
              ) : (
                <h3 className="font-bold text-foreground text-base sm:text-lg truncate">
                  {provider?.fullName}
                </h3>
              )}
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-green-200">
                <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Đã xác minh
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-1.5">
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-pale-gray text-muted-foreground text-[9px] sm:text-[10px] font-bold uppercase tracking-widest border border-platinum-tint">
                <div className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-green-500"></span>
                </div>
                Trực tuyến
              </div>
              {provider?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {isAuthenticated
                    ? provider.phone
                    : provider.phone.slice(0, 4) +
                      '****' +
                      provider.phone.slice(-2)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto sm:ml-auto shrink-0 mt-2 sm:mt-0">
          {provider?.id && (
            <Link
              href={`/providers/${provider.id}`}
              className="w-full sm:w-auto"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full text-midnight-indigo border-midnight-indigo/20 hover:bg-pale-gray"
              >
                Xem hồ sơ
              </Button>
            </Link>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto bg-action-blue border-action-blue text-white hover:bg-glacier-blue hover:border-glacier-blue"
            onClick={onStartChat}
            disabled={chatLoading}
          >
            <MessageSquare className="w-4 h-4 mr-1.5" />
            {chatLoading ? 'Đang mở…' : 'Nhắn tin cho thợ'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

