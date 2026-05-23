'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Camera,
  CheckCircle2,
  FileText,
  Gavel,
  Loader2,
  MessageSquareText,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { adminApi } from '@/features/auth/services/api';

type ParsedAiSummary = {
  confidence: number;
  recommendation: string;
  reasoning: string;
  evidencePoints: string[];
  anomalies: string[];
  messagesAnalyzed: number;
  imagesAnalyzed: number;
};

function parseAiSummary(raw?: string | null): ParsedAiSummary {
  if (!raw) {
    return {
      confidence: 0,
      recommendation: 'Chưa có phân tích AI cho vụ tranh chấp này.',
      reasoning: 'Hệ thống sẽ hiển thị dữ liệu tranh chấp gốc để nhân viên tự đối chiếu.',
      evidencePoints: [],
      anomalies: [],
      messagesAnalyzed: 0,
      imagesAnalyzed: 0,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    const normalizeList = (value: unknown) =>
      Array.isArray(value)
        ? value
            .map((item) =>
              typeof item === 'string'
                ? item
                : (item as { text?: string; description?: string })?.text ||
                  (item as { text?: string; description?: string })?.description ||
                  '',
            )
            .filter(Boolean)
        : [];

    return {
      confidence: parsed.confidence ?? parsed.confidenceScore ?? 70,
      recommendation:
        parsed.recommendation ?? parsed.suggestedAction ?? 'Cần admin đối chiếu thêm.',
      reasoning: parsed.reasoning ?? parsed.summary ?? raw,
      evidencePoints: normalizeList(parsed.evidencePoints ?? parsed.evidence),
      anomalies: normalizeList(parsed.anomalies ?? parsed.redFlags),
      messagesAnalyzed: parsed.messagesAnalyzed ?? 0,
      imagesAnalyzed: parsed.imagesAnalyzed ?? 0,
    };
  } catch {
    const lines = raw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      confidence: 70,
      recommendation: lines[0] || 'Cần admin đối chiếu thêm.',
      reasoning: raw,
      evidencePoints: lines.filter((line) => line.startsWith('+') || line.startsWith('✅')),
      anomalies: lines.filter((line) => line.startsWith('!') || line.startsWith('⚠')),
      messagesAnalyzed: 0,
      imagesAnalyzed: 0,
    };
  }
}

export default function AdminDisputeAiHelperPage() {
  const params = useParams<{ id: string }>();
  const [dispute, setDispute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params?.id) return;

    adminApi
      .getDisputeDetail(Number(params.id))
      .then((response) => setDispute(response.data.data))
      .catch(() => setError('Không tải được hồ sơ tranh chấp.'))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const aiSummary = useMemo(() => parseAiSummary(dispute?.aiSummary), [dispute?.aiSummary]);
  const booking = dispute?.booking;
  const confidenceTone =
    aiSummary.confidence >= 80
      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
      : aiSummary.confidence >= 60
        ? 'text-amber-700 bg-amber-50 border-amber-200'
        : 'text-rose-700 bg-rose-50 border-rose-200';

  if (loading) {
    return (
      <div className="admin-panel flex min-h-[480px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-slate-900" />
          Đang tải AI helper...
        </div>
      </div>
    );
  }

  if (error || !dispute) {
    return (
      <div className="admin-panel p-8">
        <p className="text-sm font-semibold text-rose-700">{error || 'Không tìm thấy tranh chấp.'}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/admin/disputes">Quay lại danh sách</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="icon" className="rounded-md">
            <Link href={`/admin/disputes/${params.id}`} aria-label="Quay lại chi tiết tranh chấp">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                Trợ lý tranh chấp AI
              </h1>
              <Badge className="border border-sky-200 bg-sky-50 text-sky-700">Gemini analysis</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Đối chiếu hồ sơ #{dispute.id} và đơn {booking?.bookingCode || 'N/A'} trước khi chốt phán quyết.
            </p>
          </div>
        </div>
        <Button asChild className="rounded-md bg-slate-950 text-white hover:bg-slate-800">
          <Link href={`/admin/disputes/${params.id}`}>
            <Gavel className="h-4 w-4" />
            Mở bảng phán quyết
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <Card className="admin-panel">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-slate-600" />
                Hồ sơ khiếu nại
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 md:grid-cols-2">
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Khách hàng báo lỗi</p>
                <p className="mt-2 text-sm leading-6 text-slate-800">{dispute.reason || 'Không có mô tả.'}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Thông tin đơn</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold">Dịch vụ:</span> {booking?.service?.name || 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold">Khách:</span> {booking?.customer?.fullName || 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold">Thợ:</span> {booking?.provider?.fullName || 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold">Trạng thái:</span> {booking?.status || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="admin-panel">
            <CardHeader className="border-b border-slate-200">
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="h-4 w-4 text-slate-600" />
                Bằng chứng gốc
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 md:grid-cols-2">
              <EvidenceGrid
                title="Khách hàng"
                items={dispute.evidences ?? []}
                emptyLabel="Khách hàng chưa tải bằng chứng."
              />
              <EvidenceGrid
                title="Thợ nghiệm thu"
                items={(booking?.attachments ?? []).filter((item: any) => item.type === 'RESULT')}
                emptyLabel="Thợ chưa có ảnh nghiệm thu."
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="overflow-hidden border-slate-800 bg-slate-950 text-white shadow-xl">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                Kết luận AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="grid grid-cols-[auto_1fr] items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="grid h-20 w-20 place-items-center rounded-full border-4 border-cyan-300/70 text-xl font-black">
                  {aiSummary.confidence}%
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-200">Độ tin cậy</p>
                  <p className="mt-1 text-sm text-slate-300">
                    AI chỉ là lớp gợi ý. Admin/Staff vẫn chịu trách nhiệm phán quyết cuối.
                  </p>
                </div>
              </div>

              <div className={`rounded-lg border p-4 ${confidenceTone}`}>
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide">
                  <Scale className="h-4 w-4" />
                  Đề xuất
                </p>
                <p className="mt-2 text-sm font-semibold leading-6">{aiSummary.recommendation}</p>
              </div>

              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-300">
                  <Bot className="h-4 w-4" />
                  Lập luận
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{aiSummary.reasoning}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-1">
            <InsightList
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              title="Điểm bằng chứng"
              items={aiSummary.evidencePoints}
              emptyLabel="AI chưa trích xuất điểm bằng chứng."
            />
            <InsightList
              icon={<AlertTriangle className="h-4 w-4 text-amber-600" />}
              title="Điểm bất thường"
              items={aiSummary.anomalies}
              emptyLabel="Không có bất thường rõ ràng."
            />
          </div>

          <div className="admin-panel grid grid-cols-2 gap-3 p-4">
            <Metric icon={<MessageSquareText className="h-4 w-4" />} label="Tin nhắn" value={aiSummary.messagesAnalyzed} />
            <Metric icon={<ShieldCheck className="h-4 w-4" />} label="Hình ảnh" value={aiSummary.imagesAnalyzed} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EvidenceGrid({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: any[];
  emptyLabel: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
      {items.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {items.slice(0, 6).map((item, index) => (
            <a
              key={`${item.fileUrl}-${index}`}
              href={item.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
            >
              <img
                src={item.fileUrl}
                alt={`${title} ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function InsightList({
  icon,
  title,
  items,
  emptyLabel,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <div className="admin-panel p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
        {icon}
        {title}
      </p>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">{emptyLabel}</p>
        ) : (
          items.map((item, index) => (
            <p key={index} className="rounded-md bg-slate-50 px-3 py-2 text-sm leading-5 text-slate-700">
              {item}
            </p>
          ))
        )}
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="admin-kpi-number mt-2 text-2xl font-black text-slate-950">{value}</p>
    </div>
  );
}
