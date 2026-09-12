import React, { useMemo } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "../../constants/colors";
import {
  ProviderEmptyState,
  ProviderLoadingState,
  ProviderScreen,
} from "../../components/provider/provider-ui";
import { useProviderBookingDetail } from "../../features/booking/hooks/useProviderBookingDetail";
import { BookingHeaderSection } from "../../features/booking/components/BookingHeaderSection";
import { BookingServiceDetailCard } from "../../features/booking/components/BookingServiceDetailCard";
import { CustomerDetailCard } from "../../features/booking/components/CustomerDetailCard";
import { SurveyorInfoCard } from "../../features/booking/components/SurveyorInfoCard";
import { CompletionWorkSection } from "../../features/booking/components/CompletionWorkSection";
import { BookingActionBar } from "../../features/booking/components/BookingActionBar";
import { ProviderBookingTimeline } from "../../features/booking/components/BookingTimelineSection";
import { QuotationSheetModal } from "../../features/booking/components/QuotationSheetModal";
import { CancelBookingModal } from "../../features/booking/components/CancelBookingModal";
import { SupplementaryQuoteModal } from "../../features/booking/components/SupplementaryQuoteModal";

export default function ProviderBookingDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const activeColors = theme.dark ? Colors.dark : Colors.light;
  const styles = useMemo(() => getStyles(insets), [insets]);

  const {
    booking,
    loading,
    actionLoading,
    refreshing,
    message,
    timeline,
    formatPrice,
    requireKyc,
    onRefresh,
    // Quote modal
    showQuoteModal,
    setShowQuoteModal,
    quoteEstimatedTime,
    setQuoteEstimatedTime,
    quoteNote,
    setQuoteNote,
    quoteError,
    setQuoteError,
    surveyImages,
    setSurveyImages,
    quoteItems,
    newItemName,
    setNewItemName,
    newItemUnit,
    setNewItemUnit,
    newItemPrice,
    setNewItemPrice,
    newItemQty,
    setNewItemQty,
    handleUpdateItemQty,
    handleRemoveQuoteItem,
    handleAddNewItem,
    handleSendQuote,
    // Supp quote modal
    showSuppQuoteModal,
    setShowSuppQuoteModal,
    suppQuoteNote,
    setSuppQuoteNote,
    suppQuoteError,
    setSuppQuoteError,
    suppQuoteItems,
    handleUpdateSuppItemQty,
    handleRemoveSuppQuoteItem,
    handleAddSuppItem,
    handleSendSuppQuote,
    // Surveyor
    surveyorName,
    setSurveyorName,
    surveyorPhone,
    setSurveyorPhone,
    handleConfirmSurveyor,
    // Cancel modal
    showCancelModal,
    setShowCancelModal,
    cancelReason,
    setCancelReason,
    cancelError,
    setCancelError,
    handleCancel,
    // Workflow actions
    handleAcceptBooking,
    handleDeclineBooking,
    handleStart,
    handleArrive,
    handleComplete,
    resultImages,
    setResultImages,
    pickImages,
    takePhoto,
    removeResultImage,
  } = useProviderBookingDetail();

  if (loading) {
    return (
      <ProviderScreen>
        <ProviderLoadingState label="Đang tải thông tin đơn hàng…" />
      </ProviderScreen>
    );
  }

  if (!booking) {
    return (
      <ProviderScreen scroll>
        <ProviderEmptyState
          icon="clipboard-alert-outline"
          title="Không tìm thấy đơn hàng"
          description="Đơn hàng có thể đã bị xóa hoặc bạn không còn quyền truy cập."
          actionLabel="Quay lại"
          onAction={() => router.back()}
        />
      </ProviderScreen>
    );
  }

  const hasBottomActions = [
    "PENDING",
    "ACCEPTED",
    "QUOTED",
    "CONFIRMED",
    "IN_PROGRESS",
  ].includes(booking.status);

  return (
    <ProviderScreen>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[activeColors.primary]}
          />
        }
        contentContainerStyle={[
          styles.content,
          hasBottomActions && styles.contentWithActions,
        ]}
        contentInsetAdjustmentBehavior="automatic"
      >
        <BookingHeaderSection
          bookingCode={booking.bookingCode}
          status={booking.status}
          desiredTime={booking.desiredTime}
          providerResponseDeadline={booking.providerResponseDeadline}
          message={message}
          onBack={() => router.back()}
        />

        <ProviderBookingTimeline
          timeline={timeline}
          fallbackStatus={booking.status}
          booking={booking}
        />

        <BookingServiceDetailCard
          service={booking.service}
          bookingItems={booking.bookingItems}
          quotation={booking.quotation}
          formatPrice={formatPrice}
        />

        <CustomerDetailCard
          customer={booking.customer}
          addressDetail={booking.addressDetail}
          ward={booking.ward}
          district={booking.district}
          province={booking.province}
          desiredTime={booking.desiredTime}
          note={booking.note}
          dispute={booking.dispute}
          status={booking.status}
        />

        <SurveyorInfoCard
          assignedSurveyorName={booking.surveyorName}
          assignedSurveyorPhone={booking.surveyorPhone}
          canAssign={booking.status === "ACCEPTED"}
          surveyorName={surveyorName}
          surveyorPhone={surveyorPhone}
          actionLoading={actionLoading}
          onChangeSurveyorName={setSurveyorName}
          onChangeSurveyorPhone={setSurveyorPhone}
          onConfirmSurveyor={handleConfirmSurveyor}
        />

        <CompletionWorkSection
          status={booking.status}
          resultImages={resultImages}
          onPickImages={() => pickImages(setResultImages, 10)}
          onTakePhoto={() => takePhoto(setResultImages, 10)}
          onRemoveImage={removeResultImage}
        />
      </ScrollView>

      <BookingActionBar
        status={booking.status}
        actionLoading={actionLoading}
        canArrive={Boolean(booking.providerArrivedAt === null)}
        hasResultImages={resultImages.length > 0}
        onAccept={handleAcceptBooking}
        onDecline={handleDeclineBooking}
        onArrive={handleArrive}
        onOpenQuote={() => requireKyc(() => setShowQuoteModal(true))}
        onStart={handleStart}
        onComplete={handleComplete}
        onOpenSuppQuote={() => setShowSuppQuoteModal(true)}
        onOpenCancel={() => setShowCancelModal(true)}
      />

      <QuotationSheetModal
        visible={showQuoteModal}
        quoteError={quoteError}
        quoteItems={quoteItems}
        newItemName={newItemName}
        newItemUnit={newItemUnit}
        newItemPrice={newItemPrice}
        newItemQty={newItemQty}
        quoteEstimatedTime={quoteEstimatedTime}
        quoteNote={quoteNote}
        surveyImages={surveyImages}
        actionLoading={actionLoading}
        onDismiss={() => {
          setShowQuoteModal(false);
          setQuoteError("");
        }}
        onUpdateItemQty={handleUpdateItemQty}
        onRemoveQuoteItem={handleRemoveQuoteItem}
        onChangeNewItemName={setNewItemName}
        onChangeNewItemUnit={setNewItemUnit}
        onChangeNewItemPrice={setNewItemPrice}
        onChangeNewItemQty={setNewItemQty}
        onAddNewItem={handleAddNewItem}
        onChangeEstimatedTime={(v) => {
          setQuoteEstimatedTime(v);
          setQuoteError("");
        }}
        onChangeNote={setQuoteNote}
        onPickImages={() => pickImages(setSurveyImages, 5)}
        onSendQuote={handleSendQuote}
      />

      <CancelBookingModal
        visible={showCancelModal}
        cancelReason={cancelReason}
        cancelError={cancelError}
        actionLoading={actionLoading}
        onChangeReason={(v) => {
          setCancelReason(v);
          setCancelError("");
        }}
        onDismiss={() => {
          setShowCancelModal(false);
          setCancelError("");
        }}
        onConfirm={handleCancel}
      />

      <SupplementaryQuoteModal
        visible={showSuppQuoteModal}
        suppQuoteError={suppQuoteError}
        suppQuoteItems={suppQuoteItems}
        newItemName={newItemName}
        newItemUnit={newItemUnit}
        newItemPrice={newItemPrice}
        newItemQty={newItemQty}
        suppQuoteNote={suppQuoteNote}
        actionLoading={actionLoading}
        onDismiss={() => {
          setShowSuppQuoteModal(false);
          setSuppQuoteError("");
        }}
        onUpdateSuppItemQty={handleUpdateSuppItemQty}
        onRemoveSuppQuoteItem={handleRemoveSuppQuoteItem}
        onChangeNewItemName={setNewItemName}
        onChangeNewItemUnit={setNewItemUnit}
        onChangeNewItemPrice={setNewItemPrice}
        onChangeNewItemQty={setNewItemQty}
        onAddSuppItem={handleAddSuppItem}
        onChangeNote={setSuppQuoteNote}
        onSendSuppQuote={handleSendSuppQuote}
      />
    </ProviderScreen>
  );
}

const getStyles = (insets: any) =>
  StyleSheet.create({
    content: {
      padding: 16,
      paddingBottom: 32,
      gap: 14,
    },
    contentWithActions: {
      paddingBottom: Math.max(insets.bottom, 16) + 120,
    },
  });
