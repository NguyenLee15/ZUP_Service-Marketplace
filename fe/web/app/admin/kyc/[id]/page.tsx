"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { adminApi } from "@/features/admin/services/admin.api";
import { AdminPermissionGuard } from "@/features/admin/components/AdminPermissionGuard";
import { AdminPermission } from "@/types/admin-permissions";
import { KycDetail, KycDocument } from "@/features/admin/kyc/types/kyc.types";
import {
  KycImageViewer,
  KycDecisionCard,
  KycProviderInfoCard,
} from "@/features/admin/kyc/components";

function AdminKYCDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = Number(params?.id);

  const [kyc, setKyc] = useState<KycDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [selectedLabel, setSelectedLabel] = useState<string>("");

  const fetchDetail = useCallback(async () => {
    if (!id || isNaN(id)) return;
    setLoading(true);
    try {
      const res = await adminApi.getKycDetail(id);
      const data: KycDetail = res.data?.data;
      setKyc(data);
      if (data?.cccdFrontUrl) {
        setSelectedImage(data.cccdFrontUrl);
        setSelectedLabel("CCCD Mặt trước");
      }
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể tải thông tin hồ sơ KYC",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, toast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const documents = useMemo<KycDocument[]>(() => {
    if (!kyc) return [];
    const docs: KycDocument[] = [];
    if (kyc.cccdFrontUrl) {
      docs.push({ label: "CCCD Mặt trước", url: kyc.cccdFrontUrl, icon: "🪪" });
    }
    if (kyc.cccdBackUrl) {
      docs.push({ label: "CCCD Mặt sau", url: kyc.cccdBackUrl, icon: "🪪" });
    }
    if (kyc.portraitUrl) {
      docs.push({ label: "Ảnh chân dung", url: kyc.portraitUrl, icon: "👤" });
    }
    if (kyc.certificateUrl) {
      docs.push({ label: "Chứng chỉ hành nghề", url: kyc.certificateUrl, icon: "📜" });
    }
    return docs;
  }, [kyc]);

  const handleSelectDocument = (doc: KycDocument) => {
    setSelectedImage(doc.url);
    setSelectedLabel(doc.label);
  };

  const handleApprove = async () => {
    if (!kyc) return;
    setActionLoading(true);
    try {
      await adminApi.approveKyc(kyc.id);
      toast({ title: "Thành công", description: "Đã phê duyệt hồ sơ KYC" });
      fetchDetail();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Không thể duyệt hồ sơ";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!kyc) return;
    setActionLoading(true);
    try {
      await adminApi.rejectKyc(kyc.id, reason);
      toast({ title: "Thành công", description: "Đã từ chối hồ sơ KYC" });
      fetchDetail();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message || "Không thể từ chối hồ sơ";
      toast({ title: "Lỗi", description: msg, variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Đang tải hồ sơ KYC...</p>
        </div>
      </div>
    );
  }

  if (!kyc) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <AlertCircle className="h-10 w-10 text-slate-400" />
        <p className="font-semibold text-slate-700">Không tìm thấy hồ sơ KYC</p>
        <Button variant="outline" onClick={() => router.push("/admin/kyc")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Title Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/kyc">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Chi tiết hồ sơ KYC #{kyc.id}
          </h1>
          <p className="text-xs text-slate-500">
            Thợ: {kyc.provider?.fullName || "Chưa có tên"} • {kyc.provider?.phone || "Chưa có SĐT"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Viewer */}
        <div className="lg:col-span-8">
          <KycImageViewer
            documents={documents}
            selectedImage={selectedImage}
            selectedLabel={selectedLabel}
            onSelectDocument={handleSelectDocument}
          />
        </div>

        {/* Right Column: Provider Info & Decision */}
        <div className="lg:col-span-4 space-y-6">
          <KycProviderInfoCard kyc={kyc} />
          <KycDecisionCard
            kyc={kyc}
            onApprove={handleApprove}
            onReject={handleReject}
            actionLoading={actionLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminKYCDetailPage() {
  return (
    <AdminPermissionGuard permission={AdminPermission.KYC_VIEW}>
      <AdminKYCDetailContent />
    </AdminPermissionGuard>
  );
}
