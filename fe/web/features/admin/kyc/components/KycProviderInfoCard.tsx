"use client";

import React from "react";
import { User, Mail, Phone, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KycDetail } from "../types/kyc.types";

interface KycProviderInfoCardProps {
  kyc: KycDetail;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Chờ duyệt",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  APPROVED: {
    label: "Đã duyệt",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  REJECTED: {
    label: "Từ chối",
    className: "bg-red-100 text-red-800 border-red-200",
  },
};

export function KycProviderInfoCard({ kyc }: KycProviderInfoCardProps) {
  const status = statusConfig[kyc.status] || {
    label: kyc.status,
    className: "bg-slate-100 text-slate-700",
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-slate-800">
            Thông tin Thợ
          </CardTitle>
          <Badge variant="outline" className={`text-xs ${status.className}`}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 font-bold text-white text-sm shrink-0">
            {kyc.provider?.fullName?.charAt(0)?.toUpperCase() || "T"}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              {kyc.provider?.fullName || "Chưa có tên"}
            </h3>
            <p className="text-xs text-slate-500">Mã hồ sơ: #{kyc.id}</p>
          </div>
        </div>

        <div className="space-y-2 border-t pt-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{kyc.provider?.email || "Chưa có email"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{kyc.provider?.phone || "Chưa có SĐT"}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Gửi ngày: {new Date(kyc.createdAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

