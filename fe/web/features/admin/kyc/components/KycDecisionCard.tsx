"use client";

import React, { useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KycDetail } from "../types/kyc.types";

interface KycDecisionCardProps {
  kyc: KycDetail;
  onApprove: () => void;
  onReject: (reason: string) => void;
  actionLoading: boolean;
}

export function KycDecisionCard({
  kyc,
  onApprove,
  onReject,
  actionLoading,
}: KycDecisionCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return;
    onReject(rejectReason.trim());
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span>Xét duyệt hồ sơ</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {kyc.status === "PENDING" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Vui lòng kiểm tra kỹ các thông tin CCCD, ảnh chân dung và chứng chỉ
              trước khi đưa ra quyết định.
            </p>

            {!showRejectForm ? (
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-sm"
                  disabled={actionLoading}
                  onClick={onApprove}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Duyệt hồ sơ này</span>
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50 gap-1.5 text-sm"
                  disabled={actionLoading}
                  onClick={() => setShowRejectForm(true)}
                >
                  <XCircle className="w-4 h-4" />
                  <span>Từ chối hồ sơ</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-red-200 bg-red-50/50 p-3">
                <label className="text-xs font-semibold text-red-900 block">
                  Lý do từ chối <span className="text-red-600">*</span>
                </label>
                <Textarea
                  placeholder="Nhập lý do từ chối (ảnh mờ, sai thông tin...)..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="text-xs bg-white border-red-200"
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason("");
                    }}
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs"
                    disabled={actionLoading || !rejectReason.trim()}
                    onClick={handleConfirmReject}
                  >
                    {actionLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {kyc.status === "APPROVED" && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-2.5">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-emerald-900">
                Hồ sơ đã được phê duyệt
              </h4>
              <p className="text-xs text-emerald-700 mt-0.5">
                Thợ đối tác đã được cấp quyền nhận đơn và cung cấp dịch vụ trên sàn.
              </p>
            </div>
          </div>
        )}

        {kyc.status === "REJECTED" && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-red-900 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Hồ sơ đã bị từ chối</span>
            </div>
            {kyc.rejectReason && (
              <p className="text-xs text-red-700 bg-white/70 p-2.5 rounded border border-red-100">
                <strong>Lý do:</strong> {kyc.rejectReason}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

