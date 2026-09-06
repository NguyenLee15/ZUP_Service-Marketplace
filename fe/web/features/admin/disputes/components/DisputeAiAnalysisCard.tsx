'use client';

import React from 'react';
import { Sparkles, ShieldCheck, Gavel, CheckCircle2, AlertTriangle, Zap, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AiParsedSummary } from '../types/dispute-detail.types';

interface DisputeAiAnalysisCardProps {
  aiSummary: AiParsedSummary | null;
}

function ConfidenceRing({ value }: { value: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative h-24 w-24">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          className="text-slate-700/30"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white">{value}%</span>
      </div>
    </div>
  );
}

export function DisputeAiAnalysisCard({ aiSummary }: DisputeAiAnalysisCardProps) {
  return (
    <Card className="relative overflow-hidden rounded-2xl border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-xl">
      <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-bl from-purple-500/10 to-transparent" />
      <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-tr from-blue-500/10 to-transparent" />

      <CardHeader className="relative z-10 !bg-transparent border-b border-white/5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 p-2 text-white shadow-lg shadow-purple-500/30">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-bold tracking-tight text-white">
                Trợ Lý AI Phân Xử
              </CardTitle>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-purple-200">
                Gemini 2.5 Flash • Tự động phân tích bằng chứng
              </p>
            </div>
          </div>
          <Badge className="border-purple-400/30 bg-purple-500/20 text-[10px] font-bold text-purple-200">
            THỬ NGHIỆM
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 pt-5">
        {aiSummary ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
            {/* Confidence Ring */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
              <ConfidenceRing value={aiSummary.confidence} />
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Độ tin cậy
              </p>
              <div
                className="mt-2 flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest"
                style={{
                  background:
                    aiSummary.confidence >= 80
                      ? 'rgba(16,185,129,0.2)'
                      : aiSummary.confidence >= 60
                      ? 'rgba(245,158,11,0.2)'
                      : 'rgba(239,68,68,0.2)',
                  color:
                    aiSummary.confidence >= 80
                      ? '#6ee7b7'
                      : aiSummary.confidence >= 60
                      ? '#fcd34d'
                      : '#fca5a5',
                }}
              >
                <ShieldCheck className="h-3 w-3" />
                {aiSummary.confidenceLabel}
              </div>
            </div>

            {/* Analysis Details */}
            <div className="space-y-4 md:col-span-3">
              {/* Recommendation */}
              <div className="rounded-2xl border border-purple-400/20 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 p-4">
                <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-purple-300/70">
                  <Gavel className="h-3.5 w-3.5" /> Đề xuất hành động
                </div>
                <p className="text-sm font-bold leading-relaxed text-white">
                  {aiSummary.recommendation}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Evidence Points */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400/70">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Phân tích bằng chứng
                  </div>
                  <ul className="space-y-2">
                    {aiSummary.evidencePoints.length > 0 ? (
                      aiSummary.evidencePoints.map((ep, i) => (
                        <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                          <div
                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                              ep.type === 'positive'
                                ? 'bg-emerald-400'
                                : ep.type === 'negative'
                                ? 'bg-red-400'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span>{ep.text}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs italic text-slate-400">Đang chờ phân tích...</li>
                    )}
                  </ul>
                </div>

                {/* Anomalies */}
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400/70">
                    <AlertTriangle className="h-3.5 w-3.5" /> Điểm bất thường
                  </div>
                  <ul className="space-y-2">
                    {aiSummary.anomalies.length > 0 ? (
                      aiSummary.anomalies.map((a, i) => (
                        <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                          <div
                            className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                              a.type === 'critical' ? 'bg-red-400' : 'bg-amber-400'
                            }`}
                          />
                          <span>{a.text}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-xs italic text-slate-400">Không phát hiện bất thường</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-700/50">
              <Zap className="h-6 w-6 text-slate-500" />
            </div>
            <p className="text-sm font-semibold text-slate-400">AI chưa phân tích vụ việc này</p>
            <p className="mt-1 text-xs text-slate-500">Kết quả sẽ xuất hiện khi hệ thống xử lý xong.</p>
          </div>
        )}

        {aiSummary && (aiSummary.messagesAnalyzed > 0 || aiSummary.imagesAnalyzed > 0) && (
          <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3 text-[10px] font-medium text-slate-400">
            <Info className="h-3.5 w-3.5 shrink-0" />
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
  );
}

