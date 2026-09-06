'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AdminPermissionGuard } from '@/features/admin/components/AdminPermissionGuard';
import { AdminPermission } from '@/types/admin-permissions';
import { useDisputeDetailFlow } from '@/features/admin/disputes/hooks/useDisputeDetailFlow';
import {
  DisputeLightboxModal,
  DisputeHeaderBanner,
  DisputeAiAnalysisCard,
  DisputeEvidenceGallery,
  DisputePartiesSection,
  DisputeResolutionForm,
} from '@/features/admin/disputes/components';

function DisputeDetailSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-48 animate-pulse rounded-2xl border bg-slate-100" />
          <div className="h-64 animate-pulse rounded-2xl border bg-slate-100" />
        </div>
        <div className="h-80 animate-pulse rounded-2xl border bg-slate-100" />
      </div>
    </div>
  );
}

function AdminDisputeDetailContent() {
  const params = useParams();
  const disputeId = params?.id ? Number(params.id) : null;

  const {
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
  } = useDisputeDetailFlow(disputeId);

  if (loading) {
    return <DisputeDetailSkeleton />;
  }

  if (!dispute) {
    return null;
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 pb-10">
      <DisputeLightboxModal
        url={lightboxUrl}
        onClose={() => setLightboxUrl(null)}
      />

      <DisputeHeaderBanner dispute={dispute} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column — Evidence, AI, and Booking Info */}
        <div className="space-y-5 lg:col-span-2">
          {!isResolved && <DisputeAiAnalysisCard aiSummary={aiSummary} />}

          <DisputeEvidenceGallery
            dispute={dispute}
            onOpenLightbox={(url) => setLightboxUrl(url)}
          />

          <DisputePartiesSection
            booking={dispute.booking}
            quotationPrice={quotationPrice}
            onOpenLightbox={(url) => setLightboxUrl(url)}
          />
        </div>

        {/* Right Column — Resolution Decision Panel */}
        <div className="space-y-5">
          <DisputeResolutionForm
            dispute={dispute}
            quotationPrice={quotationPrice}
            decision={decision}
            reason={reason}
            penaltyAmount={penaltyAmount}
            submitting={submitting}
            onDecisionChange={setDecision}
            onReasonChange={setReason}
            onPenaltyAmountChange={setPenaltyAmount}
            onSubmit={handleResolve}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminDisputeDetailPage() {
  return (
    <AdminPermissionGuard permission={AdminPermission.DISPUTE_RESOLVE}>
      <AdminDisputeDetailContent />
    </AdminPermissionGuard>
  );
}
