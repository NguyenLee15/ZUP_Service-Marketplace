'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';
import {
  AlertCircle, Loader2, Image as ImageIcon, Clock,
  Sparkles, ShieldCheck, Info, ArrowLeft, FileText,
  MapPin, Banknote, Gavel, CheckCircle2, AlertTriangle,
  Camera, Shield, Zap
} from 'lucide-react';

// --- AI Summary Parser ---
interface AiParsedSummary {
  confidence: number;
  confidenceLabel: string;
  recommendation: string;
  evidencePoints: { type: 'positive' | 'negative' | 'neutral'; text: string }[];
  anomalies: { type: 'warning' | 'critical'; text: string }[];
  reasoning: string;
  messagesAnalyzed: number;
  imagesAnalyzed: number;
}

function parseAiSummary(raw: string | null | undefined): AiParsedSummary | null {
  if (!raw) return null;

  try {
    // Try JSON parse first (structured output from Gemini)
    const parsed = JSON.parse(raw);
    return {
      confidence: parsed.confidence ?? parsed.confidenceScore ?? 75,
      confidenceLabel: parsed.confidenceLabel ?? (parsed.confidence >= 80 ? 'Highly Reliable' : parsed.confidence >= 60 ? 'Moderate' : 'Low Confidence'),
      recommendation: parsed.recommendation ?? parsed.suggestedAction ?? 'Không có đề xuất',
      evidencePoints: (parsed.evidencePoints ?? parsed.evidence ?? []).map((e: ApiPayload) => ({
        type: e.type ?? 'neutral',
        text: typeof e === 'string' ? e : e.text ?? e.description ?? '',
      })),
      anomalies: (parsed.anomalies ?? parsed.redFlags ?? []).map((a: ApiPayload) => ({
        type: a.type ?? 'warning',
        text: typeof a === 'string' ? a : a.text ?? a.description ?? '',
      })),
      reasoning: parsed.reasoning ?? parsed.summary ?? '',
      messagesAnalyzed: parsed.messagesAnalyzed ?? 0,
      imagesAnalyzed: parsed.imagesAnalyzed ?? 0,
    };
  } catch {
    // Fallback: parse free-text AI response
    const lines = raw.split('\n').filter(Boolean);
    const evidencePoints: AiParsedSummary['evidencePoints'] = [];
    const anomalies: AiParsedSummary['anomalies'] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('✅') || trimmed.startsWith('[+]') || trimmed.startsWith('- ✅')) {
        evidencePoints.push({ type: 'positive', text: trimmed.replace(/^[-✅[\]+\s]+/, '') });
      } else if (trimmed.startsWith('❌') || trimmed.startsWith('[-]') || trimmed.startsWith('- ❌')) {
        evidencePoints.push({ type: 'negative', text: trimmed.replace(/^[-❌[\]\s]+/, '') });
      } else if (trimmed.startsWith('⚠') || trimmed.startsWith('[!]') || trimmed.startsWith('- ⚠')) {
        anomalies.push({ type: 'warning', text: trimmed.replace(/^[-⚠[!\]\s]+/, '') });
      }
    });

    return {
      confidence: 70,
      confidenceLabel: 'Moderate',
      recommendation: lines[0] || 'AI đang phân tích...',
      evidencePoints,
      anomalies,
      reasoning: raw,
      messagesAnalyzed: 0,
      imagesAnalyzed: 0,
    };
  }
}

// --- Confidence Ring Component ---
function ConfidenceRing({ value }: { value: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={radius} fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-700/30" />
        <circle
          cx="40" cy="40" r={radius} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white">{value}%</span>
      </div>
    </div>
  );
}

export default function AdminDisputeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [dispute, setDispute] = useState<ApiPayload>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<'COMPLETE' | 'PENALIZE' | null>(null);
  const [reason, setReason] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    adminApi.getDisputeDetail(Number(id))
      .then(res => setDispute(res.data.data))
      .catch(() => router.push('/admin/disputes'))
      .finally(() => setLoading(false));
  }, [id]);

  const aiSummary = useMemo(() => parseAiSummary(dispute?.aiSummary), [dispute?.aiSummary]);

  const formatDate = (d: string) => new Date(d).toLocaleString('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
  const formatPrice = (p: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p);

  const handleResolve = async () => {
    if (!decision) {
      toast({ title: 'Vui lòng chọn phán quyết', variant: 'destructive' });
      return;
    }
    if (!reason.trim()) {
      toast({ title: 'Vui lòng nhập lý do phán quyết', variant: 'destructive' });
      return;
    }
    if (decision === 'PENALIZE' && (!penaltyAmount || Number(penaltyAmount) <= 0)) {
      toast({ title: 'Vui lòng nhập số tiền phạt hợp lệ', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.resolveDispute(Number(id), {
        resolutionAction: decision,
        resolutionReason: reason,
        ...(decision === 'PENALIZE' ? { penaltyAmount: Number(penaltyAmount) } : {}),
      });

      toast({
        title: decision === 'COMPLETE'
          ? '✅ Đã hoàn thành đơn — trừ hoa hồng bình thường'
          : '⚖️ Đã phạt nhà cung cấp — trừ tiền phạt từ ví'
      });
      const refreshRes = await adminApi.getDisputeDetail(Number(id));
      setDispute(refreshRes.data.data);
    } catch (err: ApiPayload) {
      toast({
        title: 'Lỗi xử lý phán quyết',
        description: err.response?.data?.error?.message || err.response?.data?.message || err.message,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Loading Skeleton ---
  if (loading) return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 bg-slate-100 rounded-2xl animate-pulse border" />
          <div className="h-64 bg-slate-100 rounded-2xl animate-pulse border" />
        </div>
        <div className="h-80 bg-slate-100 rounded-2xl animate-pulse border" />
      </div>
    </div>
  );

  if (!dispute) return null;

  const booking = dispute.booking;
  const isResolved = dispute.status === 'RESOLVED';
  const quotationPrice = booking?.quotation?.actualPrice ? Number(booking.quotation.actualPrice) : null;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer backdrop-blur-sm"
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="Evidence" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/disputes')}
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold tracking-tight text-slate-900">
                Phân Xử Tranh Chấp
              </h3>
              <Badge className={`border-0 text-[10px] font-bold px-2.5 py-0.5 ${
                isResolved
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700 animate-pulse'
              }`}>
                {isResolved ? '✓ Đã phân định' : '⚡ Chờ phân xử'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span className="font-mono">Dispute #{dispute.id}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono">#{booking?.bookingCode || 'N/A'}</span>
              <span className="text-slate-300">•</span>
              <Clock className="w-3 h-3" />
              <span>{formatDate(dispute.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resolved Banner */}
      {isResolved && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-emerald-800 mb-1">
              Phán quyết: {dispute.resolutionAction === 'COMPLETE'
                ? '✅ Hoàn thành đơn hàng — trừ hoa hồng'
                : `⚖️ Phạt nhà cung cấp — trừ ${dispute.penaltyAmount ? formatPrice(Number(dispute.penaltyAmount)) : 'tiền phạt'} từ ví`
              }
            </p>
            <p className="text-xs text-emerald-600 leading-relaxed">{dispute.resolutionReason}</p>
            {dispute.resolvedAt && (
              <p className="text-[10px] text-emerald-500 mt-2 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Giải quyết lúc: {formatDate(dispute.resolvedAt)}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Evidence & Booking Info */}
        <div className="lg:col-span-2 space-y-5">

          {/* AI Mediator Section */}
          {!isResolved && (
            <Card className="border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 overflow-hidden relative rounded-2xl shadow-xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/10 to-transparent rounded-full translate-y-1/2 -translate-x-1/2" />

              <CardHeader className="pb-3 relative z-10 border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-white tracking-tight">
                        AI Mediator Analysis
                      </CardTitle>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-purple-300/70 mt-0.5">
                        Gemini 2.5 Flash • Tự động phân tích bằng chứng
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-[10px] font-bold">
                    BETA
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-5 relative z-10">
                {aiSummary ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {/* Confidence Ring */}
                    <div className="flex flex-col items-center justify-center p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                      <ConfidenceRing value={aiSummary.confidence} />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-3">
                        Độ tin cậy
                      </p>
                      <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                        style={{
                          background: aiSummary.confidence >= 80 ? 'rgba(16,185,129,0.2)' : aiSummary.confidence >= 60 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
                          color: aiSummary.confidence >= 80 ? '#6ee7b7' : aiSummary.confidence >= 60 ? '#fcd34d' : '#fca5a5',
                        }}>
                        <ShieldCheck className="w-3 h-3" />
                        {aiSummary.confidenceLabel}
                      </div>
                    </div>

                    {/* Analysis Details */}
                    <div className="md:col-span-3 space-y-4">
                      {/* Recommendation */}
                      <div className="p-4 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 rounded-2xl border border-purple-400/20">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-300/70 mb-2">
                          <Gavel className="w-3.5 h-3.5" /> Đề xuất hành động
                        </div>
                        <p className="text-sm font-bold text-white leading-relaxed">
                          {aiSummary.recommendation}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Evidence Points */}
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400/70 mb-3 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Phân tích bằng chứng
                          </div>
                          <ul className="space-y-2">
                            {aiSummary.evidencePoints.length > 0 ? aiSummary.evidencePoints.map((ep, i) => (
                              <li key={i} className="flex gap-2 text-xs text-slate-300 leading-relaxed">
                                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                                  ep.type === 'positive' ? 'bg-emerald-400' :
                                  ep.type === 'negative' ? 'bg-red-400' : 'bg-slate-400'
                                }`} />
                                {ep.text}
                              </li>
                            )) : (
                              <li className="text-xs text-slate-400 italic">Đang chờ phân tích...</li>
                            )}
                          </ul>
                        </div>

                        {/* Anomalies */}
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                          <div className="text-[10px] font-black uppercase tracking-widest text-amber-400/70 mb-3 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" /> Điểm bất thường
                          </div>
                          <ul className="space-y-2">
                            {aiSummary.anomalies.length > 0 ? aiSummary.anomalies.map((a, i) => (
                              <li key={i} className="flex gap-2 text-xs text-slate-300 leading-relaxed">
                                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                                  a.type === 'critical' ? 'bg-red-400' : 'bg-amber-400'
                                }`} />
                                {a.text}
                              </li>
                            )) : (
                              <li className="text-xs text-slate-400 italic">Không phát hiện bất thường</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-3">
                      <Zap className="w-6 h-6 text-slate-500" />
                    </div>
                    <p className="text-sm font-semibold text-slate-400">AI chưa phân tích vụ việc này</p>
                    <p className="text-xs text-slate-500 mt-1">Kết quả sẽ xuất hiện khi hệ thống xử lý xong.</p>
                  </div>
                )}

                {aiSummary && (aiSummary.messagesAnalyzed > 0 || aiSummary.imagesAnalyzed > 0) && (
                  <div className="mt-5 flex items-center gap-3 text-[10px] font-medium text-slate-500 bg-white/5 p-3 rounded-xl border border-white/5">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      AI đã phân tích {aiSummary.messagesAnalyzed > 0 ? `${aiSummary.messagesAnalyzed} tin nhắn` : ''}
                      {aiSummary.messagesAnalyzed > 0 && aiSummary.imagesAnalyzed > 0 ? ' và ' : ''}
                      {aiSummary.imagesAnalyzed > 0 ? `${aiSummary.imagesAnalyzed} hình ảnh bằng chứng` : ''}.
                      Admin có toàn quyền thay đổi phán quyết cuối cùng.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dispute Reason & Evidence */}
          <Card className="border-slate-200 rounded-2xl shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800">Nội dung khiếu nại</CardTitle>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Khách hàng: <strong className="text-slate-600">{booking?.customer?.fullName || 'Ẩn danh'}</strong>
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100">
                <p className="text-sm text-slate-800 leading-relaxed font-medium">{dispute.reason}</p>
              </div>

              {/* Customer Evidence */}
              {dispute.evidences?.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    Bằng chứng khách hàng ({dispute.evidences.length})
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {dispute.evidences.map((ev: ApiPayload, i: number) => (
                      <button
                        key={i}
                        onClick={() => setLightboxUrl(ev.fileUrl)}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-blue-300 transition-all hover:shadow-md"
                      >
                        {ev.type === 'VIDEO' ? (
                          <video src={ev.fileUrl} className="w-full h-full object-cover" />
                        ) : (
                          <img src={ev.fileUrl} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking & Provider Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Booking Info */}
            <Card className="border-slate-200 rounded-2xl shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-800">Thông tin đơn hàng</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dịch vụ</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[60%] truncate">
                    {booking?.service?.name || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nhà cung cấp</span>
                  <span className="font-semibold text-slate-800">{booking?.provider?.fullName || '—'}</span>
                </div>
                {quotationPrice && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Giá trị đơn</span>
                    <span className="font-bold text-lg text-blue-700">{formatPrice(quotationPrice)}</span>
                  </div>
                )}
                {booking?.quotation?.commissionRateSnapshot != null && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hoa hồng snapshot</span>
                    <span className="font-semibold text-amber-600">{booking.quotation.commissionRateSnapshot}%</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 text-xs flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Địa chỉ
                  </span>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    {[booking?.addressDetail, booking?.ward, booking?.district, booking?.province].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Provider's Result Images */}
            <Card className="border-slate-200 rounded-2xl shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-indigo-600" />
                  </div>
                  <CardTitle className="text-sm font-bold text-slate-800">Ảnh kết quả của thợ</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {booking?.attachments?.filter((a: ApiPayload) => a.type === 'RESULT').length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {booking.attachments.filter((a: ApiPayload) => a.type === 'RESULT').map((att: ApiPayload, i: number) => (
                      <button
                        key={i}
                        onClick={() => setLightboxUrl(att.fileUrl)}
                        className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 hover:border-indigo-300 transition-all hover:shadow-md"
                      >
                        <img src={att.fileUrl} alt={`Result ${i}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Thợ chưa gửi ảnh kết quả</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column — Resolution Panel */}
        <div className="space-y-5">
          <Card className="border-slate-200 rounded-2xl shadow-sm lg:sticky lg:top-6">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Gavel className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-800">Phán Quyết</CardTitle>
                  {quotationPrice && (
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Giá trị đơn: <strong className="text-blue-600">{formatPrice(quotationPrice)}</strong>
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {!isResolved ? (
                <>
                  {/* COMPLETE Option */}
                  <button
                    onClick={() => setDecision('COMPLETE')}
                    className={`w-full border-2 rounded-xl p-4 text-left transition-all ${
                      decision === 'COMPLETE'
                        ? 'border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        decision === 'COMPLETE' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">Hoàn thành đơn hàng</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Bác bỏ khiếu nại — trả tiền cho thợ (trừ hoa hồng)
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* PENALIZE Option */}
                  <button
                    onClick={() => setDecision('PENALIZE')}
                    className={`w-full border-2 rounded-xl p-4 text-left transition-all ${
                      decision === 'PENALIZE'
                        ? 'border-red-500 bg-red-50 shadow-md shadow-red-500/10'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        decision === 'PENALIZE' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-800">Phạt nhà cung cấp</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Trừ tiền phạt từ ví NCC (hoặc khóa tài khoản nếu ví âm)
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Penalty Amount Input */}
                  {decision === 'PENALIZE' && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                      <label className="block text-xs font-bold text-red-700">
                        Số tiền phạt (VNĐ) *
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={penaltyAmount}
                        onChange={(e) => setPenaltyAmount(e.target.value)}
                        placeholder={quotationPrice ? `Tối đa: ${formatPrice(quotationPrice)}` : 'Nhập số tiền phạt...'}
                        className="bg-white border-red-200 focus:border-red-400 focus:ring-red-400/20"
                      />
                      {quotationPrice && Number(penaltyAmount) > quotationPrice && (
                        <p className="text-[10px] text-red-500 font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Số tiền phạt vượt quá giá trị đơn hàng
                        </p>
                      )}
                    </div>
                  )}

                  {/* Reason */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Lý do phán quyết *
                    </label>
                    <Textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Mô tả chi tiết căn cứ phán quyết, bằng chứng đã đối chiếu..."
                      rows={4}
                      className="resize-none border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 text-sm"
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleResolve}
                    disabled={submitting || !decision}
                    className={`w-full h-12 rounded-xl font-bold text-sm transition-all shadow-lg ${
                      decision === 'PENALIZE'
                        ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                        : decision === 'COMPLETE'
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                        : 'bg-slate-300 cursor-not-allowed'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <Gavel className="w-4 h-4 mr-2" />
                        Chốt Phán Quyết
                      </>
                    )}
                  </Button>

                  {/* Warning */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] font-bold text-amber-800">Không thể hoàn tác</p>
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        Phán quyết sẽ tự động thực thi giao dịch tài chính (trừ hoa hồng hoặc trừ tiền phạt).
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-7 h-7 text-emerald-600" />
                  </div>
                  <p className="font-bold text-slate-800 text-sm">Tranh chấp đã được giải quyết</p>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-[250px] mx-auto">
                    {dispute.resolutionReason}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <Badge className={`text-[10px] font-bold px-3 py-1 border-0 ${
                      dispute.resolutionAction === 'COMPLETE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {dispute.resolutionAction === 'COMPLETE' ? '✅ Hoàn thành' : '⚖️ Phạt NCC'}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
