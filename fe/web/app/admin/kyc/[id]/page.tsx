"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { adminApi } from "@/features/auth/services/api";
import { AdminPermissionGuard } from "@/features/admin/components/AdminPermissionGuard";
import { AdminPermission } from "@/types/admin-permissions";
import {
  ZoomIn, ZoomOut, RotateCw, CheckCircle, XCircle, ArrowLeft,
  User, Mail, Phone, Shield, FileText, Maximize2,
  AlertTriangle, Loader2, ImageIcon
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  PENDING: { label: "Chờ duyệt", color: "text-amber-700", bgColor: "bg-amber-100" },
  APPROVED: { label: "Đã duyệt", color: "text-emerald-700", bgColor: "bg-emerald-100" },
  REJECTED: { label: "Từ chối", color: "text-red-700", bgColor: "bg-red-100" },
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
  const [selectedLabel, setSelectedLabel] = useState("");
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const fetchKyc = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await adminApi.getKycDetail(Number(id));
      const data = res.data.data as KycDetail;
      setKyc(data);
      setSelectedImage(data.cccdFrontUrl || data.portraitUrl || "");
      setSelectedLabel(data.cccdFrontUrl ? "CCCD mặt trước" : "Chân dung");
    } catch {
      toast({ title: "Lỗi", description: "Không thể tải hồ sơ KYC", variant: "destructive" });
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
      { label: "CCCD mặt trước", url: kyc.cccdFrontUrl, icon: "🪪" },
      { label: "CCCD mặt sau", url: kyc.cccdBackUrl, icon: "🔄" },
      { label: "Chân dung", url: kyc.portraitUrl, icon: "🧑" },
      { label: "Chứng chỉ", url: kyc.certificateUrl, icon: "📜" },
    ].filter((doc): doc is { label: string; url: string; icon: string } => Boolean(doc.url));
  }, [kyc]);

  const handleApprove = async () => {
    if (!kyc) return;
    setActionLoading(true);
    try {
      await adminApi.approveKyc(kyc.id);
      toast({ title: "✅ Đã phê duyệt hồ sơ KYC" });
      await fetchKyc();
    } catch (err: unknown) {
      toast({ title: "Lỗi", description: getApiErrorMessage(err) || "Không thể phê duyệt", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!kyc) return;
    if (!rejectReason.trim()) {
      toast({ title: "Vui lòng nhập lý do từ chối", variant: "destructive" });
      return;
    }

    setActionLoading(true);
    try {
      await adminApi.rejectKyc(kyc.id, rejectReason.trim());
      toast({ title: "Đã từ chối hồ sơ KYC" });
      setShowRejectForm(false);
      setRejectReason("");
      await fetchKyc();
    } catch (err: unknown) {
      toast({ title: "Lỗi", description: getApiErrorMessage(err) || "Không thể từ chối", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-6">
        <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="h-80 bg-slate-100 rounded-2xl animate-pulse border" />
          <div className="lg:col-span-2 h-[500px] bg-slate-100 rounded-2xl animate-pulse border" />
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse border" />
        </div>
      </div>
    );
  }
  if (!kyc) return null;

  const status = statusConfig[kyc.status] || statusConfig.PENDING;
  const canReview = kyc.status === "PENDING";

  return (
    <AdminPermissionGuard permission={AdminPermission.KYC_VIEW}>
      <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      {/* Lightbox */}
      {lightboxOpen && selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={selectedImage}
            alt="KYC Document"
            className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/kyc')}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">
                Duyệt hồ sơ KYC
              </h3>
              <Badge className={`border-0 text-[10px] font-bold ${status.bgColor} ${status.color}`}>
                {status.label}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Hồ sơ #{kyc.id} • Nộp lúc {new Date(kyc.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Provider Info + Documents Sidebar */}
        <div className="space-y-5">
          {/* Provider Card */}
          <Card className="border-slate-200 rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-800">Nhà cung cấp</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-800 font-medium">{kyc.provider?.fullName || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600 text-xs">{kyc.provider?.email || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600 text-xs">{kyc.provider?.phone || "Chưa cập nhật"}</span>
              </div>
              {kyc.reviewer && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Người duyệt</p>
                  <p className="text-xs text-slate-600">{kyc.reviewer.fullName}</p>
                </div>
              )}
              {kyc.rejectReason && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-1">Lý do từ chối</p>
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{kyc.rejectReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Tabs */}
          <Card className="border-slate-200 rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-800">Tài liệu</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {documents.map((doc) => (
                <button
                  key={doc.label}
                  onClick={() => {
                    setSelectedImage(doc.url);
                    setSelectedLabel(doc.label);
                    setZoom(100);
                    setRotation(0);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                    selectedImage === doc.url
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                      : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <span className="text-base">{doc.icon}</span>
                  {doc.label}
                </button>
              ))}
              {documents.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Không có tài liệu</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Document Viewer */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800">{selectedLabel || 'Xem tài liệu'}</CardTitle>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Zoom: {zoom}% • Xoay: {rotation}°
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoom(prev => Math.min(prev + 25, 250))}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                    title="Phóng to"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoom(prev => Math.max(prev - 25, 50))}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                    title="Thu nhỏ"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRotation(prev => (prev + 90) % 360)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                    title="Xoay 90°"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <div className="w-px h-5 bg-slate-200 mx-1" />
                  <button
                    onClick={() => { setZoom(100); setRotation(0); }}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors uppercase tracking-wider"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                    title="Phóng to toàn màn hình"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-slate-900 flex items-center justify-center overflow-hidden min-h-[500px] relative">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt="Tài liệu KYC"
                    className="max-h-[520px] max-w-full cursor-zoom-in"
                    onClick={() => setLightboxOpen(true)}
                    style={{
                      transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                      transition: "transform 0.3s ease-out",
                    }}
                  />
                ) : (
                  <div className="text-center py-16">
                    <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Chọn tài liệu để xem</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Decision Panel */}
        <div>
          <Card className="border-slate-200 rounded-2xl shadow-sm lg:sticky lg:top-6">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-800">Quyết định</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {canReview ? (
                <>
                  <Button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 font-bold"
                  >
                    {actionLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Phê duyệt
                  </Button>

                  {!showRejectForm ? (
                    <Button
                      onClick={() => setShowRejectForm(true)}
                      disabled={actionLoading}
                      variant="outline"
                      className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 font-bold"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Từ chối
                    </Button>
                  ) : (
                    <div className="space-y-3 bg-red-50 border border-red-200 rounded-xl p-4 animate-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-bold text-red-700">
                        Lý do từ chối *
                      </label>
                      <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Mô tả chi tiết lý do từ chối hồ sơ..."
                        rows={3}
                        className="resize-none border-red-200 focus:border-red-400 focus:ring-red-400/20 bg-white text-sm"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => { setShowRejectForm(false); setRejectReason(""); }}
                          variant="outline"
                          size="sm"
                          className="flex-1 rounded-lg"
                        >
                          Hủy
                        </Button>
                        <Button
                          onClick={handleReject}
                          disabled={actionLoading || !rejectReason.trim()}
                          size="sm"
                          className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                        >
                          {actionLoading && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                          Xác nhận từ chối
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700 leading-relaxed">
                      Kiểm tra kỹ hình ảnh CCCD, chân dung và chứng chỉ trước khi đưa ra quyết định. Sử dụng công cụ zoom & xoay để đối chiếu.
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className={`w-12 h-12 rounded-2xl ${status.bgColor} flex items-center justify-center mx-auto mb-3`}>
                    {kyc.status === 'APPROVED' ? (
                      <CheckCircle className={`w-6 h-6 ${status.color}`} />
                    ) : (
                      <XCircle className={`w-6 h-6 ${status.color}`} />
                    )}
                  </div>
                  <p className="font-bold text-sm text-slate-800">
                    Hồ sơ đã được {kyc.status === 'APPROVED' ? 'phê duyệt' : 'từ chối'}
                  </p>
                  {kyc.reviewer && (
                    <p className="text-xs text-slate-500 mt-1">bởi {kyc.reviewer.fullName}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </AdminPermissionGuard>
  );
}
