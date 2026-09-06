import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { adminApi } from '@/features/auth/services/api';
import { DisputeDetailData, AiParsedSummary } from '../types/dispute-detail.types';
import { parseAiSummary } from '../utils/dispute-ai-parser';

export function useDisputeDetailFlow(id: number | null) {
  const router = useRouter();
  const { toast } = useToast();

  const [dispute, setDispute] = useState<DisputeDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [decision, setDecision] = useState<'COMPLETE' | 'PENALIZE' | null>(null);
  const [reason, setReason] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchDisputeDetail = useCallback(async (disputeId: number) => {
    try {
      const res = await adminApi.getDisputeDetail(disputeId);
      const data = res.data?.data as DisputeDetailData;
      setDispute(data);
    } catch {
      toast({
        title: 'Không thể tải thông tin tranh chấp',
        description: 'Vui lòng thử lại sau',
        variant: 'destructive',
      });
      router.push('/admin/disputes');
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    if (!id || isNaN(id)) return;
    fetchDisputeDetail(id);
  }, [id, fetchDisputeDetail]);

  const aiSummary = useMemo<AiParsedSummary | null>(() => {
    return parseAiSummary(dispute?.aiSummary);
  }, [dispute?.aiSummary]);

  const quotationPrice = useMemo(() => {
    if (!dispute?.booking?.quotation?.actualPrice) return null;
    return Number(dispute.booking.quotation.actualPrice);
  }, [dispute?.booking?.quotation?.actualPrice]);

  const isResolved = dispute?.status === 'RESOLVED';

  const handleResolve = async () => {
    if (!id) return;
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
      await adminApi.resolveDispute(id, {
        resolutionAction: decision,
        resolutionReason: reason,
        ...(decision === 'PENALIZE' ? { penaltyAmount: Number(penaltyAmount) } : {}),
      });

      toast({
        title: decision === 'COMPLETE'
          ? '✅ Đã hoàn thành đơn — trừ hoa hồng bình thường'
          : '⚖️ Đã phạt nhà cung cấp — trừ tiền phạt từ ví',
      });

      await fetchDisputeDetail(id);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string; error?: { message?: string } } }; message?: string };
      const errMsg =
        apiErr.response?.data?.error?.message ||
        apiErr.response?.data?.message ||
        apiErr.message ||
        'Có lỗi xảy ra khi xử lý phán quyết';

      toast({
        title: 'Lỗi xử lý phán quyết',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    dispute,
    loading,
    submitting,
    decision,
    reason,
    penaltyAmount,
    lightboxUrl,
    aiSummary,
    quotationPrice,
    isResolved,
    setDecision,
    setReason,
    setPenaltyAmount,
    setLightboxUrl,
    handleResolve,
  };
}

