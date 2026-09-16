"use client";

import React, { useState } from "react";
import { Mail, Phone, Calendar, Eye, EyeOff } from "lucide-react";
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
  const [showSensitive, setShowSensitive] = useState(false);

  const status = statusConfig[kyc.status] || {
    label: kyc.status,
    className: "bg-slate-100 text-slate-700",
  };

  const phone = kyc.provider?.phone;
  const maskedPhone = phone
    ? phone.length > 4
      ? `••••••••${phone.slice(-4)}`
      : phone
    : "Chưa có SĐT";

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
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono">{showSensitive ? (phone || "Chưa có SĐT") : maskedPhone}</span>
            </div>
            {phone && (
              <button
                type="button"
                onClick={() => setShowSensitive((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 transition-colors shrink-0"
                title={showSensitive ? "Ẩn số điện thoại" : "Hiện đầy đủ số điện thoại"}
                aria-label={showSensitive ? "Ẩn số điện thoại" : "Hiện đầy đủ số điện thoại"}
              >
                {showSensitive ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span>Ẩn</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Hiện</span>
                  </>
                )}
              </button>
            )}
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

