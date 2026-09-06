import { AiParsedSummary } from '../types/dispute-detail.types';

interface RawEvidencePoint {
  type?: 'positive' | 'negative' | 'neutral';
  text?: string;
  description?: string;
}

interface RawAnomaly {
  type?: 'warning' | 'critical';
  text?: string;
  description?: string;
}

interface RawAiSummaryJson {
  confidence?: number;
  confidenceScore?: number;
  confidenceLabel?: string;
  recommendation?: string;
  suggestedAction?: string;
  evidencePoints?: (RawEvidencePoint | string)[];
  evidence?: (RawEvidencePoint | string)[];
  anomalies?: (RawAnomaly | string)[];
  redFlags?: (RawAnomaly | string)[];
  reasoning?: string;
  summary?: string;
  messagesAnalyzed?: number;
  imagesAnalyzed?: number;
}

export function parseAiSummary(raw: string | null | undefined): AiParsedSummary | null {
  if (!raw) return null;

  try {
    const parsed: RawAiSummaryJson = JSON.parse(raw);
    const confidence = parsed.confidence ?? parsed.confidenceScore ?? 75;
    const confidenceLabel =
      parsed.confidenceLabel ??
      (confidence >= 80 ? 'Độ tin cậy cao' : confidence >= 60 ? 'Trung bình' : 'Độ tin cậy thấp');

    const evidenceList = parsed.evidencePoints ?? parsed.evidence ?? [];
    const normalizedEvidences: AiParsedSummary['evidencePoints'] = evidenceList.map((e) => {
      if (typeof e === 'string') {
        return { type: 'neutral', text: e };
      }
      return {
        type: e.type ?? 'neutral',
        text: e.text ?? e.description ?? '',
      };
    });

    const anomalyList = parsed.anomalies ?? parsed.redFlags ?? [];
    const normalizedAnomalies: AiParsedSummary['anomalies'] = anomalyList.map((a) => {
      if (typeof a === 'string') {
        return { type: 'warning', text: a };
      }
      return {
        type: a.type ?? 'warning',
        text: a.text ?? a.description ?? '',
      };
    });

    return {
      confidence,
      confidenceLabel,
      recommendation: parsed.recommendation ?? parsed.suggestedAction ?? 'Không có đề xuất',
      evidencePoints: normalizedEvidences,
      anomalies: normalizedAnomalies,
      reasoning: parsed.reasoning ?? parsed.summary ?? '',
      messagesAnalyzed: parsed.messagesAnalyzed ?? 0,
      imagesAnalyzed: parsed.imagesAnalyzed ?? 0,
    };
  } catch {
    const lines = raw.split('\n').filter(Boolean);
    const evidencePoints: AiParsedSummary['evidencePoints'] = [];
    const anomalies: AiParsedSummary['anomalies'] = [];

    lines.forEach((line) => {
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
      confidenceLabel: 'Trung bình',
      recommendation: lines[0] || 'AI đang phân tích...',
      evidencePoints,
      anomalies,
      reasoning: raw,
      messagesAnalyzed: 0,
      imagesAnalyzed: 0,
    };
  }
}

