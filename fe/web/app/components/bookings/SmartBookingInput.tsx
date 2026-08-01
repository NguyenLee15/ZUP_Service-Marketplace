'use client';

import { useState, useCallback, useRef } from 'react';
import { bookingsApi } from '@/features/auth/services/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Loader2,
  Zap,
  Tag,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Bot,
  Lightbulb,
} from 'lucide-react';

interface IntentResult {
  isAiExtracted: boolean;
  intent: {
    categoryName: string;
    keywords: string[];
    summary: string;
    urgency: 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedBudgetMin?: number;
    estimatedBudgetMax?: number;
  };
  matchedCategory: { id: number; name: string } | null;
  suggestedServices: Array<{
    id: number;
    name: string;
    description: string | null;
    referencePrice: number | null;
    avgRating: number;
    category: { id: number; name: string };
  }>;
}

interface SmartBookingInputProps {
  onIntentExtracted: (result: IntentResult) => void;
  onServiceSelected: (serviceId: number) => void;
}

const URGENCY_MAP = {
  HIGH: { label: 'Khẩn cấp', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: AlertTriangle },
  MEDIUM: { label: 'Bình thường', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Zap },
  LOW: { label: 'Không gấp', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: Lightbulb },
};

const EXAMPLES = [
  'Máy giặt nhà tôi kêu to và không vắt được',
  'Điều hòa chảy nước, phòng không mát',
  'Ống nước nhà bếp bị rò rỉ, cần sửa gấp',
  'Cần vệ sinh máy lạnh định kỳ cho căn hộ 3 phòng',
];

export function SmartBookingInput({ onIntentExtracted, onServiceSelected }: SmartBookingInputProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IntentResult | null>(null);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const handleExtract = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed || trimmed.length < 5) {
      setError('Vui lòng mô tả chi tiết hơn (tối thiểu 5 ký tự)');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      const response = await bookingsApi.extractIntent(trimmed);
      const data = response.data?.data || response.data;
      setResult(data);
      onIntentExtracted(data);
    } catch {
      setError('Không thể phân tích yêu cầu. Vui lòng thử lại hoặc nhập thủ công.');
    } finally {
      setLoading(false);
    }
  }, [prompt, onIntentExtracted]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExtract();
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    setResult(null);
    setError('');
    textareaRef.current?.focus();
  };

  const urgencyInfo = result ? URGENCY_MAP[result.intent.urgency] : null;
  const UrgencyIcon = urgencyInfo?.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-action-blue to-glacier-blue flex items-center justify-center shadow-[0_0_12px_rgba(0,107,255,0.25)]">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Mô tả sự cố bằng ngôn ngữ tự nhiên</h3>
          <p className="text-[10px] text-muted-foreground">AI sẽ phân tích và gợi ý dịch vụ phù hợp nhất cho bạn</p>
        </div>
        <Badge className="ml-auto border-0 bg-action-blue/15 text-action-blue text-[9px] font-bold uppercase tracking-widest">
          <Sparkles className="w-3 h-3 mr-1" /> AI
        </Badge>
      </div>

      {/* Input area */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="VD: Máy giặt nhà tôi kêu to và không vắt được..."
          rows={3}
          className={`resize-none pr-24 text-sm transition-all ${
            error
              ? 'border-red-500/50 focus-visible:ring-red-500/30'
              : 'border-white/15 focus-visible:ring-action-blue/30'
          }`}
        />
        <Button
          type="button"
          onClick={handleExtract}
          disabled={loading || !prompt.trim()}
          size="sm"
          className="absolute bottom-3 right-3 bg-gradient-to-r from-action-blue to-glacier-blue hover:from-action-blue/90 hover:to-glacier-blue/90 text-white font-bold text-xs rounded-xl shadow-lg px-4 transition-all"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Phân tích
            </>
          )}
        </Button>
      </div>
      {error && <p className="text-red-400 text-[11px] font-medium">{error}</p>}

      {/* Quick examples */}
      {!result && !loading && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Thử nhanh:</p>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => handleExampleClick(ex)}
                className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] text-muted-foreground hover:text-foreground hover:border-action-blue/30 hover:bg-action-blue/5 transition-all"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-action-blue/5 border border-action-blue/20 animate-pulse">
          <Loader2 className="w-5 h-5 text-action-blue animate-spin" />
          <div>
            <p className="text-xs font-bold text-foreground">AI đang phân tích sự cố...</p>
            <p className="text-[10px] text-muted-foreground">Đang xử lý từ khóa, xác định danh mục và gợi ý dịch vụ</p>
          </div>
        </div>
      )}

      {/* Result card */}
      {result && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* AI Summary */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-action-blue/10 to-glacier-blue/5 border border-action-blue/20">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground mb-1">📋 Tóm tắt sự cố</p>
                <p className="text-sm text-foreground/90">{result.intent.summary}</p>
              </div>
              {urgencyInfo && UrgencyIcon && (
                <Badge className={`shrink-0 border text-[10px] font-bold ${urgencyInfo.color}`}>
                  <UrgencyIcon className="w-3 h-3 mr-1" />
                  {urgencyInfo.label}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3">
              <Tag className="w-3 h-3 text-muted-foreground" />
              {result.intent.keywords.map((kw) => (
                <Badge key={kw} variant="outline" className="text-[10px] border-white/15 text-foreground/80 font-medium">
                  {kw}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              {result.matchedCategory && (
                <span className="text-action-blue font-bold">
                  📂 {result.matchedCategory.name}
                </span>
              )}
              {(result.intent.estimatedBudgetMin || result.intent.estimatedBudgetMax) && (
                <span className="text-muted-foreground flex items-center gap-1">
                  <DollarSign className="w-3 h-3" />
                  {result.intent.estimatedBudgetMin ? formatPrice(result.intent.estimatedBudgetMin) : '?'}
                  {' – '}
                  {result.intent.estimatedBudgetMax ? formatPrice(result.intent.estimatedBudgetMax) : '?'}
                </span>
              )}
              {!result.isAiExtracted && (
                <Badge className="border-0 bg-amber-500/15 text-amber-400 text-[9px]">
                  Fallback mode
                </Badge>
              )}
            </div>
          </div>

          {/* Suggested services */}
          {result.suggestedServices.length > 0 && (
            <div>
              <p className="text-xs font-bold text-foreground mb-2">🔧 Dịch vụ phù hợp</p>
              <div className="space-y-2">
                {result.suggestedServices.map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => onServiceSelected(svc.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/5 hover:border-action-blue/40 hover:bg-action-blue/5 transition-all group text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{svc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{svc.category.name}</span>
                        <span className="text-[10px] text-amber-400">★ {svc.avgRating.toFixed(1)}</span>
                        {svc.referencePrice && (
                          <span className="text-[10px] text-action-blue font-bold">
                            {formatPrice(svc.referencePrice)}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-action-blue transition-colors shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
