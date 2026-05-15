"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { adminApi } from "@/features/auth/services/api";
import { ZoomIn, ZoomOut, RotateCw, CheckCircle, XCircle } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ duyệt", color: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Đã duyệt", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Từ chối", color: "bg-red-100 text-red-800" },
};

interface KycUser {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface KycDetail {
  id: number;
  status: string;
  createdAt: string;
  cccdFrontUrl?: string | null;
  cccdBackUrl?: string | null;
  portraitUrl?: string | null;
  certificateUrl?: string | null;
  rejectReason?: string | null;
  provider?: KycUser | null;
  reviewer?: KycUser | null;
}

function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError<{ error?: { message?: string } }>(error)) {
    return undefined;
  }
  return error.response?.data?.error?.message;
}

export default function AdminKYCDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [kyc, setKyc] = useState<KycDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState("");
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchKyc = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await adminApi.getKycDetail(Number(id));
      const data = res.data.data as KycDetail;
      setKyc(data);
      setSelectedImage(data.cccdFrontUrl || data.portraitUrl || "");
    } catch {
      toast({
        title: "Lỗi",
        description: "Không thể tải hồ sơ KYC",
        variant: "destructive",
      });
      router.push("/admin/kyc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKyc();
  }, [id]);

  const documents = useMemo(() => {
    if (!kyc) return [];
    return [
      { label: "CCCD mặt trước", url: kyc.cccdFrontUrl },
      { label: "CCCD mặt sau", url: kyc.cccdBackUrl },
      { label: "Chân dung", url: kyc.portraitUrl },
      { label: "Chứng chỉ", url: kyc.certificateUrl },
    ].filter((doc): doc is { label: string; url: string } => Boolean(doc.url));
  }, [kyc]);

  const handleApprove = async () => {
    if (!kyc) return;
    setActionLoading(true);
    try {
      await adminApi.approveKyc(kyc.id);
      toast({ title: "Đã phê duyệt hồ sơ KYC" });
      await fetchKyc();
    } catch (err: unknown) {
      toast({
        title: "Lỗi",
        description: getApiErrorMessage(err) || "Không thể phê duyệt",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!kyc) return;
    const reason = window.prompt("Nhập lý do từ chối:");
    if (!reason?.trim()) return;

    setActionLoading(true);
    try {
      await adminApi.rejectKyc(kyc.id, reason.trim());
      toast({ title: "Đã từ chối hồ sơ KYC" });
      await fetchKyc();
    } catch (err: unknown) {
      toast({
        title: "Lỗi",
        description: getApiErrorMessage(err) || "Không thể từ chối",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="h-96 rounded-xl bg-muted animate-pulse" />;
  }
  if (!kyc) return null;

  const status = statusConfig[kyc.status] || statusConfig.PENDING;
  const canReview = kyc.status === "PENDING";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Duyệt hồ sơ KYC</h1>
        <p className="text-muted-foreground mt-1">ID hồ sơ: {kyc.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nhà cung cấp</CardTitle>
            <Badge className={`w-fit ${status.color}`}>{status.label}</Badge>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <Info label="Họ tên" value={kyc.provider?.fullName} />
            <Info label="Email" value={kyc.provider?.email} />
            <Info
              label="Điện thoại"
              value={kyc.provider?.phone || "Chưa cập nhật"}
            />
            <Info
              label="Ngày nộp"
              value={new Date(kyc.createdAt).toLocaleString("vi-VN")}
            />
            {kyc.reviewer && (
              <Info label="Người duyệt" value={kyc.reviewer.fullName} />
            )}
            {kyc.rejectReason && (
              <Info label="Lý do từ chối" value={kyc.rejectReason} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tài liệu xác minh</CardTitle>
            <div className="flex gap-2 mt-3 flex-wrap">
              {documents.map((doc) => (
                <Button
                  key={doc.label}
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedImage(doc.url)}
                >
                  {doc.label}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-950 rounded-lg p-4 flex items-center justify-center overflow-hidden min-h-[400px]">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Tài liệu KYC"
                  className="max-h-[520px] max-w-full"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transition: "transform 0.2s",
                  }}
                />
              ) : (
                <p className="text-white/70 text-sm">Không có tài liệu</p>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom((prev) => Math.min(prev + 20, 200))}
              >
                <ZoomIn className="h-4 w-4 mr-1" /> Phóng to
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setZoom((prev) => Math.max(prev - 20, 50))}
              >
                <ZoomOut className="h-4 w-4 mr-1" /> Thu nhỏ
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRotation((prev) => (prev + 90) % 360)}
              >
                <RotateCw className="h-4 w-4 mr-1" /> Xoay
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setZoom(100);
                  setRotation(0);
                }}
              >
                Reset
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Zoom: {zoom}% | Xoay: {rotation} do
            </p>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Quyết định</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              onClick={handleApprove}
              disabled={!canReview || actionLoading}
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Phê duyệt
            </Button>

            <Button
              onClick={handleReject}
              disabled={!canReview || actionLoading}
              variant="destructive"
              className="w-full h-12"
            >
              <XCircle className="mr-2 h-5 w-5" />
              Từ chối
            </Button>

            {!canReview && (
              <p className="text-sm text-muted-foreground text-center">
                Hồ sơ này đã được xử lý.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="font-medium text-foreground break-words">{value || "-"}</p>
    </div>
  );
}
