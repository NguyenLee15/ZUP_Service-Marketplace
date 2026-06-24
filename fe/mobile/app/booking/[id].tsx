import { useCallback, useEffect, useState } from "react";
import type { ComponentProps, Dispatch, SetStateAction } from "react";
import {
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  IconButton,
  Modal,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { bookingApi } from "../../features/booking/booking.api";
import { useAuthStore } from "../../features/auth/auth.store";
import { useNotificationStore } from "../../features/notification/notification.store";
import {
  BOOKING_STATUS_LABEL,
  type BookingStatus,
} from "../../constants/booking-status";
import { Colors } from "../../constants/colors";
import {
  ProviderCard,
  ProviderEmptyState,
  ProviderInlineMessage,
  ProviderLoadingState,
  ProviderPageHeader,
  ProviderScreen,
  ProviderSectionHeader,
  ProviderStatusChip,
} from "../../components/provider/provider-ui";
import { getTrackingSocket } from "../../lib/socket";

type ImageSetter = Dispatch<SetStateAction<ImagePicker.ImagePickerAsset[]>>;
type MessageState = {
  tone: "success" | "warning" | "error" | "info";
  text: string;
} | null;

type BookingTimelineItem = {
  id?: number | string;
  fromStatus?: string | null;
  toStatus?: string | null;
  note?: string | null;
  createdAt?: string | Date | null;
  changedBy?: number | null;
};

const getStatusColor = (status: string, activeColors: typeof Colors.light | typeof Colors.dark): string => {
  const map: Record<string, string> = {
    PENDING: activeColors.statusPending,
    QUOTED: activeColors.statusQuoted,
    CONFIRMED: activeColors.statusConfirmed,
    IN_PROGRESS: activeColors.statusInProgress,
    DONE: activeColors.statusDone,
    CANCELLED: activeColors.statusCancelled,
    DISPUTED: activeColors.statusDisputed,
  };
  return map[status] || activeColors.textSecondary;
};

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export default function ProviderBookingDetailScreen() {
  const theme = useTheme();
  const { user } = useAuthStore();
  const activeColors = theme.dark ? Colors.dark : Colors.light;

  const requireKyc = (action: () => void) => {
    if (user?.kycStatus !== 'APPROVED') {
      Alert.alert(
        "Yêu cầu xác thực",
        "Vui lòng hoàn tất hồ sơ và xác minh CCCD để có thể nhận việc hoặc báo giá.",
        [
          { text: "Đóng", style: "cancel" },
          { text: "Xác thực ngay", onPress: () => router.push('/profile/kyc') }
        ]
      );
      return;
    }
    action();
  };

  const insets = useSafeAreaInsets();
  const styles = getStyles(theme, activeColors, insets);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bookingSignal = useNotificationStore((state) => state.bookingSignal);

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [timeline, setTimeline] = useState<BookingTimelineItem[]>([]);

  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteEstimatedTime, setQuoteEstimatedTime] = useState("");
  const [quoteNote, setQuoteNote] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [surveyorName, setSurveyorName] = useState("");
  const [surveyorPhone, setSurveyorPhone] = useState("");
  const [surveyImages, setSurveyImages] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);
  const [quoteItems, setQuoteItems] = useState<
    { name: string; unit: string; price: number; quantity: number }[]
  >([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  const [showSuppQuoteModal, setShowSuppQuoteModal] = useState(false);
  const [suppQuoteNote, setSuppQuoteNote] = useState("");
  const [suppQuoteError, setSuppQuoteError] = useState("");
  const [suppQuoteItems, setSuppQuoteItems] = useState<
    { name: string; unit: string; price: number; quantity: number }[]
  >([]);

  const [resultImages, setResultImages] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);

  const fetchBooking = useCallback(async () => {
    try {
      const [detailRes, timelineRes] = await Promise.all([
        bookingApi.getById(Number(id)),
        bookingApi.getTimeline(Number(id)).catch(() => null),
      ]);
      setBooking(detailRes.data?.data);
      const timelineData = timelineRes?.data?.data;
      setTimeline(Array.isArray(timelineData) ? timelineData : []);
    } catch {
      setMessage({
        tone: "error",
        text: "Không thể tải thông tin đơn hàng. Kéo xuống để thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  useEffect(() => {
    if (bookingSignal?.bookingId === Number(id)) {
      void fetchBooking();
    }
  }, [bookingSignal, fetchBooking, id]);

  // Foreground Location Tracking (PENDING, QUOTED, CONFIRMED, IN_PROGRESS)
  useEffect(() => {
    if (!booking?.id || !booking?.status) return;
    
    // Only track when provider is likely moving to/working at customer location
    const trackableStatuses = ["PENDING", "QUOTED", "CONFIRMED", "IN_PROGRESS"];
    if (!trackableStatuses.includes(booking.status)) return;

    let isMounted = true;
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          console.warn("Foreground location permission denied");
          return;
        }

        const socket = await getTrackingSocket();

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            if (isMounted) {
              socket.emit("updateLocation", {
                bookingId: booking.id,
                lat: location.coords.latitude,
                lng: location.coords.longitude,
                heading: location.coords.heading,
                speed: location.coords.speed,
              });
            }
          }
        );
      } catch (err) {
        console.error("Error setting up location tracking:", err);
      }
    })();

    return () => {
      isMounted = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [booking?.id, booking?.status]);

  useEffect(() => {
    if (showQuoteModal && booking) {
      if (booking.bookingItems && booking.bookingItems.length > 0) {
        setQuoteItems(
          booking.bookingItems.map((item: any) => ({
            name: item.name,
            unit: item.unit,
            price: Number(item.priceSnapshot),
            quantity: item.quantity,
          })),
        );
      } else {
        setQuoteItems([
          {
            name: booking.service?.name || "Dịch vụ",
            unit: "Lượt",
            price: Number(booking.service?.referencePrice || 0),
            quantity: 1,
          },
        ]);
      }
    }
  }, [showQuoteModal, booking]);

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setQuoteItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, quantity: newQty } : item,
      ),
    );
  };

  const handleRemoveQuoteItem = (index: number) => {
    setQuoteItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddNewItem = () => {
    const name = newItemName.trim();
    const unit = newItemUnit.trim();
    const price = Number(newItemPrice.replace(/[^0-9]/g, ""));
    const qty = Number(newItemQty) || 1;

    if (!name) {
      setQuoteError("Vui lòng nhập tên hạng mục phát sinh.");
      return;
    }
    if (!unit) {
      setQuoteError("Vui lòng nhập đơn vị tính.");
      return;
    }
    if (isNaN(price) || price <= 0) {
      setQuoteError("Vui lòng nhập đơn giá hợp lệ.");
      return;
    }

    setQuoteItems((prev) => [...prev, { name, unit, price, quantity: qty }]);
    setNewItemName("");
    setNewItemUnit("");
    setNewItemPrice("");
    setNewItemQty("1");
    setQuoteError("");
  };

  const handleUpdateSuppItemQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setSuppQuoteItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, quantity: newQty } : item,
      ),
    );
  };

  const handleRemoveSuppQuoteItem = (index: number) => {
    setSuppQuoteItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddSuppItem = () => {
    const name = newItemName.trim();
    const unit = newItemUnit.trim();
    const price = Number(newItemPrice.replace(/[^0-9]/g, ""));
    const qty = Number(newItemQty) || 1;

    if (!name) {
      setSuppQuoteError("Vui lòng nhập tên hạng mục phát sinh.");
      return;
    }
    if (!unit) {
      setSuppQuoteError("Vui lòng nhập đơn vị tính.");
      return;
    }
    if (isNaN(price) || price <= 0) {
      setSuppQuoteError("Vui lòng nhập đơn giá hợp lệ.");
      return;
    }

    setSuppQuoteItems((prev) => [...prev, { name, unit, price, quantity: qty }]);
    setNewItemName("");
    setNewItemUnit("");
    setNewItemPrice("");
    setNewItemQty("1");
    setSuppQuoteError("");
  };


  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setMessage(null);
    await fetchBooking();
    setRefreshing(false);
  }, [fetchBooking]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 0);

  const pickImages = async (setter: ImageSetter, max = 5) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.75,
      selectionLimit: max,
    });
    if (!result.canceled) {
      setter((prev) => [...prev, ...result.assets].slice(0, max));
      setMessage(null);
    }
  };

  const takePhoto = async (setter: ImageSetter, max = 10) => {
    const result = await ImagePicker.launchCameraAsync({ quality: 0.75 });
    if (!result.canceled) {
      setter((prev) => [...prev, ...result.assets].slice(0, max));
      setMessage(null);
    }
  };

  const removeResultImage = (indexToRemove: number) => {
    setResultImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove),
    );
    setMessage(null);
  };

  const handleAcceptBooking = () => {
    Alert.alert(
      "Nhận đơn hàng?",
      "Sau khi nhận đơn, bạn có thể cập nhật thợ khảo sát và gửi báo giá cho khách.",
      [
        { text: "Để sau", style: "cancel" },
        {
          text: "Nhận đơn",
          onPress: async () => {
            setActionLoading(true);
            setMessage(null);
            try {
              await bookingApi.acceptBooking(Number(id));
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success,
              );
              setMessage({
                tone: "success",
                text: "Đã nhận đơn hàng. Vui lòng cập nhật thợ khảo sát.",
              });
              await fetchBooking();
            } catch (err: any) {
              setMessage({
                tone: "error",
                text:
                  err?.response?.data?.error?.message ||
                  "Không thể nhận đơn hàng.",
              });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleDeclineBooking = () => {
    Alert.alert(
      "Từ chối đơn hàng?",
      "Khách hàng sẽ được thông báo để tìm thợ khác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Từ chối",
          style: "destructive",
          onPress: async () => {
            setActionLoading(true);
            setMessage(null);
            try {
              await bookingApi.declineBooking(Number(id), {
                reason: "Nhà cung cấp từ chối nhận đơn",
              });
              setMessage({ tone: "success", text: "Đã từ chối đơn hàng." });
              await fetchBooking();
            } catch (err: any) {
              setMessage({
                tone: "error",
                text:
                  err?.response?.data?.error?.message ||
                  "Không thể từ chối đơn hàng.",
              });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleConfirmSurveyor = async () => {
    if (!surveyorName.trim() || !surveyorPhone.trim()) {
      setMessage({
        tone: "warning",
        text: "Vui lòng nhập đầy đủ tên và số điện thoại thợ khảo sát.",
      });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      await bookingApi.confirmSurveyor(Number(id), {
        surveyorName: surveyorName.trim(),
        surveyorPhone: surveyorPhone.trim(),
      });
      setMessage({
        tone: "success",
        text: "Đã cập nhật thông tin thợ khảo sát.",
      });
      await fetchBooking();
    } catch (err: any) {
      setMessage({
        tone: "error",
        text: err?.response?.data?.error?.message || "Thao tác thất bại.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendQuote = async () => {
    if (quoteItems.length === 0) {
      setQuoteError("Vui lòng thêm ít nhất một hạng mục báo giá.");
      return;
    }
    if (!quoteEstimatedTime.trim()) {
      setQuoteError("Vui lòng nhập thời gian dự kiến.");
      return;
    }
    if (quoteEstimatedTime.trim().length > 100) {
      setQuoteError("Thời gian dự kiến tối đa 100 ký tự.");
      return;
    }

    setActionLoading(true);
    setQuoteError("");
    try {
      const formData = new FormData();
      formData.append("estimatedTime", quoteEstimatedTime.trim());
      if (quoteNote.trim()) formData.append("note", quoteNote.trim());
      formData.append("items", JSON.stringify(quoteItems));
      surveyImages.forEach((img, index) => {
        formData.append("surveyImages", {
          uri: img.uri,
          name: `survey_${index}.jpg`,
          type: "image/jpeg",
        } as any);
      });

      await bookingApi.sendQuote(Number(id), formData);
      setShowQuoteModal(false);
      setQuoteEstimatedTime("");
      setQuoteNote("");
      setSurveyImages([]);
      setQuoteItems([]);
      setMessage({ tone: "success", text: "Đã gửi báo giá cho khách hàng." });
      await fetchBooking();
    } catch (err: any) {
      setQuoteError(
        err?.response?.data?.error?.message || "Gửi báo giá thất bại.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendSuppQuote = async () => {
    if (suppQuoteItems.length === 0) {
      setSuppQuoteError("Vui lòng thêm ít nhất một hạng mục báo giá bổ sung.");
      return;
    }

    setActionLoading(true);
    setSuppQuoteError("");
    try {
      await bookingApi.sendSupplementaryQuote(Number(id), {
        note: suppQuoteNote.trim(),
        items: suppQuoteItems,
      });
      setShowSuppQuoteModal(false);
      setSuppQuoteNote("");
      setSuppQuoteItems([]);
      setMessage({ tone: "success", text: "Đã gửi báo giá phát sinh cho khách hàng." });
      await fetchBooking();
    } catch (err: any) {
      setSuppQuoteError(
        err?.response?.data?.error?.message || "Gửi báo giá phát sinh thất bại.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = () => {
    Alert.alert("Xác nhận", "Bắt đầu thực hiện đơn hàng?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Bắt đầu",
        onPress: async () => {
          setActionLoading(true);
          setMessage(null);
          try {
            await bookingApi.startWork(Number(id));
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
            setMessage({
              tone: "success",
              text: "Đã bắt đầu thực hiện đơn hàng.",
            });
            await fetchBooking();
          } catch (err: any) {
            setMessage({
              tone: "error",
              text: err?.response?.data?.error?.message || "Thao tác thất bại.",
            });
          } finally {
            setActionLoading(false);
          }
        },
      },
    ]);
  };

  const handleArrive = async () => {
    try {
      setActionLoading(true);
      setMessage(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Lỗi", "Cần cấp quyền vị trí để xác nhận.");
        setActionLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      
      const fullAddress = [booking.addressDetail, booking.ward, booking.district, booking.province]
        .filter(Boolean)
        .filter(p => p !== 'Không áp dụng')
        .join(', ');
        
      const geocoded = await Location.geocodeAsync(fullAddress);
      
      let shouldWarn = false;
      if (geocoded && geocoded.length > 0) {
        const target = geocoded[0];
        const dist = getDistanceFromLatLonInKm(
          currentLocation.coords.latitude, 
          currentLocation.coords.longitude, 
          target.latitude, 
          target.longitude
        );
        if (dist > 0.5) { // 500m
          shouldWarn = true;
        }
      } else {
        shouldWarn = true;
      }

      const proceedArrive = async () => {
        try {
          setActionLoading(true);
          await bookingApi.arriveAtLocation(Number(id));
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await fetchBooking();
          setMessage({ tone: 'success', text: 'Đã báo đến nơi' });
        } catch(err: any) {
          setMessage({ tone: 'error', text: err?.response?.data?.error?.message || 'Báo đến nơi thất bại' });
        } finally {
          setActionLoading(false);
        }
      };

      if (shouldWarn) {
        Alert.alert(
          "Cảnh báo",
          "Vị trí của bạn dường như cách xa nhà khách hơn 500m. Bạn có chắc chắn đã đến nơi?",
          [
            { text: "Hủy", style: "cancel", onPress: () => setActionLoading(false) },
            { text: "Vẫn xác nhận", onPress: proceedArrive },
          ]
        );
      } else {
        await proceedArrive();
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Lỗi", "Không thể lấy vị trí hiện tại.");
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (resultImages.length === 0) {
      setMessage({
        tone: "warning",
        text: "Vui lòng chụp hoặc chọn ảnh kết quả công việc.",
      });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      resultImages.forEach((img, index) => {
        formData.append("resultImages", {
          uri: img.uri,
          name: `result_${index}.jpg`,
          type: "image/jpeg",
        } as any);
      });
      await bookingApi.completeWork(Number(id), formData);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResultImages([]);
      setMessage({
        tone: "success",
        text: "Đã báo hoàn thành. Đang chờ khách hàng nghiệm thu.",
      });
      await fetchBooking();
    } catch (err: any) {
      setMessage({
        tone: "error",
        text: err?.response?.data?.error?.message || "Thao tác thất bại.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError("Vui lòng nhập lý do hủy.");
      return;
    }

    setActionLoading(true);
    setCancelError("");
    try {
      await bookingApi.cancelBooking(Number(id), {
        reason: cancelReason.trim(),
      });
      setShowCancelModal(false);
      setCancelReason("");
      setMessage({ tone: "success", text: "Đã hủy đơn hàng." });
      await fetchBooking();
    } catch (err: any) {
      setCancelError(
        err?.response?.data?.error?.message || "Hủy đơn thất bại.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <ProviderScreen>
        <ProviderLoadingState label="Đang tải đơn hàng…" />
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

  const color = getStatusColor(booking.status, activeColors);
  const statusLabel =
    BOOKING_STATUS_LABEL[booking.status as BookingStatus] || booking.status;
  const isAwaitingProviderAcceptance =
    booking.status === "PENDING" && !booking.providerAcceptedAt;
  const canHandlePendingWorkflow =
    booking.status === "PENDING" && Boolean(booking.providerAcceptedAt);
  const isAnyModalVisible = showQuoteModal || showCancelModal || showSuppQuoteModal;
  const responseDeadline = booking.providerResponseDeadline
    ? new Date(booking.providerResponseDeadline).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;
  const hasBottomActions = [
    "PENDING",
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
        <ProviderPageHeader
          title={`#${booking.bookingCode}`}
          subtitle="Chi tiết đơn hàng và thao tác xử lý."
          action={
            <IconButton
              icon="arrow-left"
              mode="contained-tonal"
              onPress={() => router.back()}
              accessibilityLabel="Quay lại"
            />
          }
        />

        {message && (
          <ProviderInlineMessage tone={message.tone} message={message.text} />
        )}

        <ProviderCard contentStyle={styles.statusCard}>
          <View style={styles.statusTopRow}>
            <View>
              <Text variant="labelLarge" style={styles.mutedText}>
                Trạng thái đơn
              </Text>
              <Text variant="titleMedium" style={styles.statusTitle}>
                {statusLabel}
              </Text>
            </View>
            <ProviderStatusChip label={statusLabel} color={color} selected />
          </View>
          <View style={styles.statusMetaRow}>
            <MaterialCommunityIcons
              name="calendar-clock-outline"
              size={18}
              color={activeColors.textSecondary}
            />
            <Text variant="bodySmall" style={styles.mutedText}>
              {booking.desiredTime
                ? new Date(booking.desiredTime).toLocaleString("vi-VN")
                : "Chưa có lịch"}
            </Text>
          </View>
          {isAwaitingProviderAcceptance && (
            <ProviderInlineMessage
              tone="warning"
              icon="timer-sand"
              message={`Đơn mới cần nhận trong 1 phút${responseDeadline ? `, hạn phản hồi ${responseDeadline}` : ""}.`}
            />
          )}
        </ProviderCard>

        <ProviderBookingTimeline
          timeline={timeline}
          fallbackStatus={booking.status}
          booking={booking}
        />

        <ProviderCard>
          <ProviderSectionHeader title="Dịch vụ" />
          <Text variant="titleMedium" style={styles.cardTitle} selectable>
            {booking.service?.name || "Dịch vụ"}
          </Text>
          {booking.service?.category?.name && (
            <Text variant="bodySmall" style={styles.mutedText}>
              {booking.service.category.name}
            </Text>
          )}
          {booking.bookingItems && booking.bookingItems.length > 0 && (
            <View style={styles.itemsContainer}>
              <Text variant="labelMedium" style={styles.itemsHeader}>
                Hạng mục yêu cầu chi tiết:
              </Text>
              {booking.bookingItems.map((item: any) => (
                <View key={item.id} style={styles.itemBadgeRow}>
                  <View style={styles.itemBadgeTextContainer}>
                    <Text variant="bodyMedium" style={styles.itemBadgeName}>
                      {item.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.itemBadgeUnit}>
                      Đơn giá: {formatPrice(Number(item.priceSnapshot))} /{" "}
                      {item.unit}
                    </Text>
                  </View>
                  <View style={styles.itemBadgeRight}>
                    <Text variant="bodyMedium" style={styles.itemBadgeQty}>
                      x{item.quantity}
                    </Text>
                    <Text variant="bodyMedium" style={styles.itemBadgeTotal}>
                      {formatPrice(Number(item.priceSnapshot) * item.quantity)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ProviderCard>

        <ProviderCard>
          <ProviderSectionHeader title="Khách hàng" />
          <InfoRow
            icon="account-outline"
            text={booking.customer?.fullName || "Khách hàng"}
            selectable
          />
          <InfoRow
            icon="phone-outline"
            text={booking.customer?.phone || "Chưa có số điện thoại"}
            selectable
          />
          <InfoRow
            icon="map-marker-outline"
            text={
              [
                booking.addressDetail,
                booking.ward,
                booking.district,
                booking.province,
              ]
                .filter(Boolean)
                .filter((p) => p !== "Không áp dụng")
                .join(", ") || "Chưa có địa chỉ"
            }
            selectable
          />
          <InfoRow
            icon="calendar-outline"
            text={
              booking.desiredTime
                ? new Date(booking.desiredTime).toLocaleString("vi-VN")
                : "Chưa có lịch"
            }
          />
          {booking.note && (
            <View style={styles.noteBox}>
              <Text variant="bodySmall" style={styles.noteText}>
                {booking.note}
              </Text>
            </View>
          )}
        </ProviderCard>

        {booking.quotation && (
          <ProviderCard>
            <ProviderSectionHeader title="Báo giá" />
            <View style={styles.priceRow}>
              <Text variant="bodyMedium" style={styles.mutedText}>
                Giá thực tế
              </Text>
              <Text variant="titleMedium" style={styles.priceText} selectable>
                {formatPrice(Number(booking.quotation.actualPrice))}
              </Text>
            </View>
            {booking.quotation.estimatedTime && (
              <View style={styles.priceRow}>
                <Text variant="bodyMedium" style={styles.mutedText}>
                  Thời gian dự kiến
                </Text>
                <Text variant="bodyMedium" style={styles.cardTitle} selectable>
                  {booking.quotation.estimatedTime}
                </Text>
              </View>
            )}
            {booking.quotation.note && (
              <View style={styles.noteBox}>
                <Text variant="bodySmall" style={styles.noteText}>
                  {booking.quotation.note}
                </Text>
              </View>
            )}
            {booking.quotation.quotationItems &&
              booking.quotation.quotationItems.length > 0 && (
                <View style={styles.itemsContainer}>
                  <Text variant="labelMedium" style={styles.itemsHeader}>
                    Hạng mục báo giá chi tiết:
                  </Text>
                  {booking.quotation.quotationItems.map((item: any) => {
                    const isExtra = !booking.bookingItems?.some(
                      (bi: any) =>
                        bi.name.toLowerCase() === item.name.toLowerCase(),
                    );
                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.itemBadgeRow,
                          isExtra && styles.extraItemBadgeRow,
                        ]}
                      >
                        <View style={styles.itemBadgeTextContainer}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            <Text
                              variant="bodyMedium"
                              style={styles.itemBadgeName}
                            >
                              {item.name}
                            </Text>
                            {isExtra && (
                              <View style={styles.extraBadge}>
                                <Text style={styles.extraBadgeText}>
                                  Phát sinh
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text
                            variant="bodySmall"
                            style={styles.itemBadgeUnit}
                          >
                            {formatPrice(Number(item.price))} / {item.unit}
                          </Text>
                        </View>
                        <View style={styles.itemBadgeRight}>
                          <Text
                            variant="bodyMedium"
                            style={styles.itemBadgeQty}
                          >
                            x{item.quantity}
                          </Text>
                          <Text
                            variant="bodyMedium"
                            style={styles.itemBadgeTotal}
                          >
                            {formatPrice(Number(item.price) * item.quantity)}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
          </ProviderCard>
        )}

        {booking.status === "DISPUTED" && booking.dispute && (
          <ProviderCard style={styles.disputeCard}>
            <ProviderInlineMessage
              tone="error"
              icon="alert-decagram-outline"
              message={`Khiếu nại từ khách hàng: ${booking.dispute.reason}`}
            />
            {booking.dispute.aiSummary && (
              <View style={styles.noteBox}>
                <Text variant="labelMedium" style={styles.cardTitle}>
                  Tóm tắt hệ thống
                </Text>
                <Text variant="bodySmall" style={styles.noteText}>
                  {booking.dispute.aiSummary}
                </Text>
              </View>
            )}
            {booking.dispute.evidences?.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.evidenceRow}
              >
                {booking.dispute.evidences.map(
                  (evidence: any, index: number) => (
                    <Image
                      key={`${evidence.fileUrl}-${index}`}
                      source={{ uri: evidence.fileUrl }}
                      style={styles.evidenceImage}
                    />
                  ),
                )}
              </ScrollView>
            )}
          </ProviderCard>
        )}

        {(canHandlePendingWorkflow || booking.surveyorName) && (
          <ProviderCard contentStyle={styles.formSection}>
            <ProviderSectionHeader title="Thợ khảo sát" />
            {booking.surveyorName ? (
              <View>
                <InfoRow
                  icon="account-hard-hat"
                  text={booking.surveyorName}
                  selectable
                />
                <InfoRow
                  icon="phone-outline"
                  text={booking.surveyorPhone || "Chưa có"}
                  selectable
                />
              </View>
            ) : (
              <View>
                <TextInput
                  label="Tên thợ khảo sát"
                  value={surveyorName}
                  onChangeText={setSurveyorName}
                  mode="outlined"
                  left={
                    <TextInput.Icon
                      icon="account-hard-hat"
                      accessibilityLabel="Tên thợ khảo sát"
                    />
                  }
                />
                <TextInput
                  label="SĐT thợ khảo sát"
                  value={surveyorPhone}
                  onChangeText={setSurveyorPhone}
                  mode="outlined"
                  keyboardType="phone-pad"
                  left={
                    <TextInput.Icon
                      icon="phone"
                      accessibilityLabel="Số điện thoại thợ khảo sát"
                    />
                  }
                />
                <Button
                  mode="contained"
                  onPress={handleConfirmSurveyor}
                  loading={actionLoading}
                  disabled={actionLoading}
                  style={styles.primaryButton}
                  icon="check"
                >
                  {actionLoading ? "Đang xử lý…" : "Xác nhận thợ khảo sát"}
                </Button>
              </View>
            )}
          </ProviderCard>
        )}

        {booking.status === "IN_PROGRESS" && (
          <ProviderCard contentStyle={styles.formSection}>
            <ProviderSectionHeader title="Ảnh kết quả công việc" />
            <View style={styles.dualButtonRow}>
              <Button
                mode="outlined"
                icon="image-multiple"
                onPress={() => pickImages(setResultImages, 10)}
                style={styles.flexButton}
              >
                Chọn ảnh
              </Button>
              <Button
                mode="outlined"
                icon="camera"
                onPress={() => takePhoto(setResultImages, 10)}
                style={styles.flexButton}
              >
                Chụp ảnh
              </Button>
            </View>
            {resultImages.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.evidenceRow}
              >
                {resultImages.map((image, index) => (
                  <View key={`${image.uri}-${index}`} style={styles.imageTile}>
                    <Image
                      source={{ uri: image.uri }}
                      style={styles.evidenceImage}
                    />
                    <IconButton
                      icon="close"
                      mode="contained"
                      size={14}
                      onPress={() => removeResultImage(index)}
                      accessibilityLabel="Xóa ảnh nghiệm thu"
                      style={styles.removeImageButton}
                      iconColor={activeColors.error}
                    />
                  </View>
                ))}
              </ScrollView>
            )}
          </ProviderCard>
        )}
      </ScrollView>

      {!isAnyModalVisible && hasBottomActions && (
        <View
          style={[
            styles.actionBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.outlineVariant,
            },
          ]}
        >
          {booking.status === "PENDING" && (
            <>
              {isAwaitingProviderAcceptance ? (
                <>
                  <Button
                    mode="contained"
                    onPress={() => requireKyc(handleAcceptBooking)}
                    loading={actionLoading}
                    disabled={actionLoading}
                    style={styles.actionButton}
                    icon="check-circle-outline"
                    contentStyle={styles.actionContent}
                  >
                    Nhận đơn
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handleDeclineBooking}
                    disabled={actionLoading}
                    textColor={activeColors.error}
                    style={[
                      styles.actionButton,
                      { borderColor: activeColors.error },
                    ]}
                    icon="close-circle-outline"
                    contentStyle={styles.actionContent}
                  >
                    Từ chối
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    mode="contained"
                    onPress={() => requireKyc(() => setShowQuoteModal(true))}
                    style={styles.actionButton}
                    icon="file-document-edit-outline"
                    contentStyle={styles.actionContent}
                  >
                    Gửi báo giá
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => setShowCancelModal(true)}
                    textColor={activeColors.error}
                    style={[
                      styles.actionButton,
                      { borderColor: activeColors.error },
                    ]}
                    icon="close-circle-outline"
                    contentStyle={styles.actionContent}
                  >
                    Hủy đơn
                  </Button>
                </>
              )}
            </>
          )}
          {booking.status === "QUOTED" && (
            <Button
              mode="outlined"
              onPress={() => setShowCancelModal(true)}
              textColor={activeColors.error}
              style={[
                styles.actionButton,
                styles.singleAction,
                { borderColor: activeColors.error },
              ]}
              icon="close-circle-outline"
              contentStyle={styles.actionContent}
            >
              Hủy đơn
            </Button>
          )}
          {booking.status === "CONFIRMED" && (
            <>
              {!booking.providerArrivedAt ? (
                <Button
                  mode="contained"
                  onPress={handleArrive}
                  loading={actionLoading}
                  disabled={actionLoading}
                  style={[styles.actionButton, styles.singleAction]}
                  icon="map-marker-check-outline"
                  contentStyle={styles.actionContent}
                >
                  {actionLoading ? "Đang xử lý…" : "Tôi đã đến nơi"}
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={handleStart}
                  loading={actionLoading}
                  disabled={actionLoading}
                  style={[styles.actionButton, styles.singleAction]}
                  icon="play-circle-outline"
                  contentStyle={styles.actionContent}
                >
                  {actionLoading ? "Đang xử lý…" : "Bắt đầu thực hiện"}
                </Button>
              )}
            </>
          )}
          {booking.status === "IN_PROGRESS" && (
            <View style={{ gap: 8 }}>
              <Button
                mode="contained"
                onPress={handleComplete}
                loading={actionLoading}
                disabled={actionLoading || resultImages.length === 0}
                style={[
                  styles.actionButton,
                  styles.singleAction,
                  { backgroundColor: activeColors.success },
                ]}
                icon="check-circle-outline"
                contentStyle={styles.actionContent}
              >
                {actionLoading ? "Đang xử lý…" : "Hoàn thành"}
              </Button>
              <Button
                mode="outlined"
                onPress={() => setShowSuppQuoteModal(true)}
                disabled={actionLoading}
                style={[
                  styles.actionButton,
                  styles.singleAction,
                ]}
                icon="plus-circle-outline"
                contentStyle={styles.actionContent}
              >
                Báo giá phát sinh
              </Button>
            </View>
          )}

        </View>
      )}

      <Portal>
        <Modal
          visible={showQuoteModal}
          onDismiss={() => {
            setShowQuoteModal(false);
            setQuoteError("");
          }}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Gửi báo giá khảo sát
          </Text>
          {quoteError ? (
            <ProviderInlineMessage tone="error" message={quoteError} />
          ) : null}

          {/* Danh sách các hạng mục chi tiết */}
          <Text
            variant="labelMedium"
            style={{
              color: activeColors.textSecondary,
              fontWeight: "700",
              marginTop: 4,
            }}
          >
            Chi tiết hạng mục báo giá:
          </Text>
          <ScrollView
            style={styles.modalItemsScroll}
            contentContainerStyle={{ gap: 8 }}
          >
            {quoteItems.map((item, index) => (
              <View key={index} style={styles.modalItemRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="bodyMedium"
                    style={{ fontWeight: "700", color: activeColors.text }}
                  >
                    {item.name}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: activeColors.textTertiary }}
                  >
                    {formatPrice(item.price)} / {item.unit}
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <IconButton
                    icon="minus-circle-outline"
                    size={22}
                    onPress={() =>
                      handleUpdateItemQty(index, item.quantity - 1)
                    }
                    style={{ margin: 0 }}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{
                      fontWeight: "700",
                      minWidth: 20,
                      textAlign: "center",
                      color: activeColors.text,
                    }}
                  >
                    {item.quantity}
                  </Text>
                  <IconButton
                    icon="plus-circle-outline"
                    size={22}
                    onPress={() =>
                      handleUpdateItemQty(index, item.quantity + 1)
                    }
                    style={{ margin: 0 }}
                  />
                  <IconButton
                    icon="trash-can-outline"
                    iconColor={activeColors.error}
                    size={20}
                    onPress={() => handleRemoveQuoteItem(index)}
                    style={{ margin: 0 }}
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Form thêm hạng mục phát sinh */}
          <View style={styles.addItemSection}>
            <Text
              variant="labelMedium"
              style={{ color: activeColors.primaryLight, fontWeight: "700" }}
            >
              + Thêm hạng mục phát sinh:
            </Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
              <TextInput
                label="Tên hạng mục"
                value={newItemName}
                onChangeText={setNewItemName}
                mode="outlined"
                style={{ flex: 2 }}
                dense
              />
              <TextInput
                label="Đơn vị"
                value={newItemUnit}
                onChangeText={setNewItemUnit}
                mode="outlined"
                style={{ flex: 1 }}
                dense
                placeholder="mét, cái"
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: 6,
                marginTop: 6,
                alignItems: "center",
              }}
            >
              <TextInput
                label="Đơn giá (đ)"
                value={newItemPrice}
                onChangeText={setNewItemPrice}
                mode="outlined"
                keyboardType="numeric"
                style={{ flex: 2 }}
                dense
              />
              <TextInput
                label="Số lượng"
                value={newItemQty}
                onChangeText={setNewItemQty}
                mode="outlined"
                keyboardType="numeric"
                style={{ flex: 1 }}
                dense
              />
              <Button
                mode="contained"
                onPress={handleAddNewItem}
                style={{
                  borderRadius: 8,
                  height: 40,
                  justifyContent: "center",
                }}
                contentStyle={{ height: 40 }}
              >
                Thêm
              </Button>
            </View>
          </View>

          {/* Tổng cộng thực tế */}
          <View style={styles.modalTotalRow}>
            <Text variant="bodyMedium" style={styles.mutedText}>
              Tổng cộng thực tế:
            </Text>
            <Text variant="titleMedium" style={styles.modalTotalText}>
              {formatPrice(
                quoteItems.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0,
                ),
              )}
            </Text>
          </View>

          <TextInput
            label="Thời gian dự kiến"
            value={quoteEstimatedTime}
            onChangeText={(value) => {
              setQuoteEstimatedTime(value);
              setQuoteError("");
            }}
            mode="outlined"
            maxLength={100}
            placeholder="Ví dụ: 2 giờ, 1 ngày"
            left={
              <TextInput.Icon
                icon="timer-outline"
                accessibilityLabel="Thời gian dự kiến"
              />
            }
          />
          <TextInput
            label="Ghi chú thêm"
            value={quoteNote}
            onChangeText={setQuoteNote}
            mode="outlined"
            multiline
            numberOfLines={3}
            left={
              <TextInput.Icon
                icon="note-text"
                accessibilityLabel="Ghi chú báo giá"
              />
            }
          />
          <Button
            mode="outlined"
            icon="image"
            onPress={() => pickImages(setSurveyImages, 5)}
            style={styles.primaryButton}
          >
            Ảnh khảo sát ({surveyImages.length})
          </Button>
          <Button
            mode="contained"
            onPress={handleSendQuote}
            loading={actionLoading}
            disabled={
              actionLoading ||
              quoteItems.length === 0 ||
              !quoteEstimatedTime.trim()
            }
            style={styles.primaryButton}
            contentStyle={styles.actionContent}
          >
            {actionLoading ? "Đang gửi…" : "Gửi báo giá"}
          </Button>
          <Button mode="text" onPress={() => setShowQuoteModal(false)}>
            Đóng
          </Button>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={showCancelModal}
          onDismiss={() => {
            setShowCancelModal(false);
            setCancelError("");
          }}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text
            variant="titleMedium"
            style={[styles.modalTitle, { color: activeColors.error }]}
          >
            Hủy đơn hàng
          </Text>
          {cancelError ? (
            <ProviderInlineMessage tone="error" message={cancelError} />
          ) : null}
          <TextInput
            label="Lý do hủy"
            value={cancelReason}
            onChangeText={(value) => {
              setCancelReason(value);
              setCancelError("");
            }}
            mode="outlined"
            multiline
            numberOfLines={3}
            left={
              <TextInput.Icon
                icon="alert-circle-outline"
                accessibilityLabel="Lý do hủy"
              />
            }
          />
          <Button
            mode="contained"
            onPress={handleCancel}
            loading={actionLoading}
            disabled={actionLoading || !cancelReason.trim()}
            style={[
              styles.primaryButton,
              { backgroundColor: activeColors.error },
            ]}
            contentStyle={styles.actionContent}
          >
            {actionLoading ? "Đang xử lý…" : "Xác nhận hủy"}
          </Button>
          <Button mode="text" onPress={() => setShowCancelModal(false)}>
            Đóng
          </Button>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={showSuppQuoteModal}
          onDismiss={() => {
            setShowSuppQuoteModal(false);
            setSuppQuoteError("");
          }}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
            Gửi báo giá phát sinh
          </Text>
          {suppQuoteError ? (
            <ProviderInlineMessage tone="error" message={suppQuoteError} />
          ) : null}

          <Text
            variant="labelMedium"
            style={{
              color: activeColors.textSecondary,
              fontWeight: "700",
              marginTop: 4,
            }}
          >
            Chi tiết hạng mục bổ sung:
          </Text>
          <ScrollView
            style={styles.modalItemsScroll}
            contentContainerStyle={{ gap: 8 }}
          >
            {suppQuoteItems.map((item, index) => (
              <View key={index} style={styles.modalItemRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    variant="bodyMedium"
                    style={{ fontWeight: "700", color: activeColors.text }}
                  >
                    {item.name}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: activeColors.textTertiary }}
                  >
                    {formatPrice(item.price)} / {item.unit}
                  </Text>
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <IconButton
                    icon="minus-circle-outline"
                    size={22}
                    onPress={() =>
                      handleUpdateSuppItemQty(index, item.quantity - 1)
                    }
                    style={{ margin: 0 }}
                  />
                  <Text
                    variant="bodyMedium"
                    style={{
                      fontWeight: "700",
                      minWidth: 20,
                      textAlign: "center",
                      color: activeColors.text,
                    }}
                  >
                    {item.quantity}
                  </Text>
                  <IconButton
                    icon="plus-circle-outline"
                    size={22}
                    onPress={() =>
                      handleUpdateSuppItemQty(index, item.quantity + 1)
                    }
                    style={{ margin: 0 }}
                  />
                  <IconButton
                    icon="trash-can-outline"
                    iconColor={activeColors.error}
                    size={20}
                    onPress={() => handleRemoveSuppQuoteItem(index)}
                    style={{ margin: 0 }}
                  />
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.addItemSection}>
            <Text
              variant="labelMedium"
              style={{ color: activeColors.primaryLight, fontWeight: "700" }}
            >
              + Thêm hạng mục:
            </Text>
            <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
              <TextInput
                label="Tên hạng mục"
                value={newItemName}
                onChangeText={setNewItemName}
                mode="outlined"
                style={{ flex: 2 }}
                dense
              />
              <TextInput
                label="Đơn vị"
                value={newItemUnit}
                onChangeText={setNewItemUnit}
                mode="outlined"
                style={{ flex: 1 }}
                dense
                placeholder="mét, cái"
              />
            </View>
            <View
              style={{
                flexDirection: "row",
                gap: 6,
                marginTop: 6,
                alignItems: "center",
              }}
            >
              <TextInput
                label="Đơn giá (đ)"
                value={newItemPrice}
                onChangeText={setNewItemPrice}
                mode="outlined"
                keyboardType="numeric"
                style={{ flex: 2 }}
                dense
              />
              <TextInput
                label="Số lượng"
                value={newItemQty}
                onChangeText={setNewItemQty}
                mode="outlined"
                keyboardType="numeric"
                style={{ flex: 1 }}
                dense
              />
              <Button
                mode="contained"
                onPress={handleAddSuppItem}
                style={{
                  borderRadius: 8,
                  height: 40,
                  justifyContent: "center",
                }}
                contentStyle={{ height: 40 }}
              >
                Thêm
              </Button>
            </View>
          </View>

          <View style={styles.modalTotalRow}>
            <Text variant="bodyMedium" style={styles.mutedText}>
              Tổng cộng phát sinh:
            </Text>
            <Text variant="titleMedium" style={styles.modalTotalText}>
              {formatPrice(
                suppQuoteItems.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0,
                ),
              )}
            </Text>
          </View>

          <TextInput
            label="Ghi chú thêm"
            value={suppQuoteNote}
            onChangeText={setSuppQuoteNote}
            mode="outlined"
            multiline
            numberOfLines={3}
            left={
              <TextInput.Icon
                icon="note-text"
                accessibilityLabel="Ghi chú"
              />
            }
          />
          <Button
            mode="contained"
            onPress={handleSendSuppQuote}
            loading={actionLoading}
            disabled={actionLoading || suppQuoteItems.length === 0}
            style={styles.primaryButton}
            contentStyle={styles.actionContent}
          >
            {actionLoading ? "Đang gửi…" : "Gửi báo giá bổ sung"}
          </Button>
          <Button mode="text" onPress={() => setShowSuppQuoteModal(false)}>
            Đóng
          </Button>
        </Modal>
      </Portal>
    </ProviderScreen>
  );
}

function InfoRow({
  icon,
  text,
  selectable,
}: {
  icon: ComponentProps<typeof MaterialCommunityIcons>["name"];
  text: string;
  selectable?: boolean;
}) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 8 }}>
      <MaterialCommunityIcons
        name={icon}
        size={18}
        color={theme.colors.onSurfaceVariant}
      />
      <Text
        variant="bodyMedium"
        style={{ flex: 1, color: theme.colors.onSurface, lineHeight: 20 }}
        selectable={selectable}
      >
        {text}
      </Text>
    </View>
  );
}

const timelineStyles = StyleSheet.create({
  timelineList: {
    gap: 14,
    marginTop: 8,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  timelineTitle: {
    flex: 1,
    fontWeight: "800",
  },
  timelineTime: {
  },
  timelineNote: {
    marginTop: 4,
    lineHeight: 18,
  },
});

function ProviderBookingTimeline({
  timeline,
  fallbackStatus,
  booking,
}: {
  timeline: BookingTimelineItem[];
  fallbackStatus?: string;
  booking?: any;
}) {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;
  const rows =
    timeline.length > 0
      ? timeline
      : fallbackStatus
        ? [{ toStatus: fallbackStatus }]
        : [];

  if (rows.length === 0) return null;

  return (
    <ProviderCard>
      <ProviderSectionHeader title="Timeline trạng thái" />
      <View style={timelineStyles.timelineList}>
        {rows.map((item, index) => {
          const status =
            item.toStatus || item.fromStatus || fallbackStatus || "PENDING";
          let label = BOOKING_STATUS_LABEL[status as BookingStatus] || status;
          if (item.note === 'Đã đến nơi') {
            label = 'Tôi đã đến';
          }
          const color = getStatusColor(status, activeColors);
          const createdAt = item.createdAt
            ? new Date(item.createdAt).toLocaleString("vi-VN")
            : "";

          let prefix = '';
          if (status === 'CANCELLED' && item.changedBy) {
            if (item.changedBy === booking?.customerId) prefix = 'Khách hàng hủy: ';
            else if (item.changedBy === booking?.providerId) prefix = 'Bạn đã hủy: ';
            else prefix = 'Hệ thống hủy: ';
          } else if (status === 'CANCELLED' && !item.changedBy) {
            prefix = 'Hệ thống hủy: ';
          }

          return (
            <View
              key={`${status}-${item.id || index}`}
              style={timelineStyles.timelineRow}
            >
              <View style={[timelineStyles.timelineDot, { backgroundColor: color }]} />
              <View style={[timelineStyles.timelineContent, { borderBottomColor: theme.colors.outlineVariant }]}>
                <View style={timelineStyles.timelineHeader}>
                  <Text variant="bodyMedium" style={[timelineStyles.timelineTitle, { color: theme.colors.onSurface }]}>
                    {label}
                  </Text>
                  {createdAt ? (
                    <Text variant="labelSmall" style={[timelineStyles.timelineTime, { color: theme.colors.onSurfaceVariant }]}>
                      {createdAt}
                    </Text>
                  ) : null}
                </View>
                {item.note || prefix ? (
                  <Text variant="bodySmall" style={[timelineStyles.timelineNote, { color: theme.colors.onSurfaceVariant }]}>
                    {prefix}{item.note || ''}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </ProviderCard>
  );
}

const getStyles = (theme: any, activeColors: any, insets: any) => StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  contentWithActions: {
    paddingBottom: Math.max(insets.bottom, 16) + 84,
  },
  statusCard: {
    gap: 12,
  },
  statusTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mutedText: {
    color: theme.colors.onSurfaceVariant,
  },
  statusTitle: {
    color: theme.colors.onSurface,
    fontWeight: "800",
    marginTop: 2,
  },
  cardTitle: {
    color: theme.colors.onSurface,
    fontWeight: "800",
    marginTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 10,
  },
  infoText: {
    flex: 1,
    lineHeight: 20,
  },
  timelineList: {
    gap: 14,
    marginTop: 8,
  },
  timelineRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  timelineHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  timelineTitle: {
    flex: 1,
    fontWeight: "800",
  },
  timelineTime: {
  },
  timelineNote: {
    marginTop: 4,
    lineHeight: 18,
  },
  noteBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceVariant,
  },
  noteText: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 10,
  },
  priceText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  disputeCard: {
    borderColor: `${activeColors.error}40`,
  },
  evidenceRow: {
    gap: 10,
    paddingTop: 10,
  },
  evidenceImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceVariant,
  },
  imageTile: {
    position: "relative",
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    margin: 0,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  formSection: {
    gap: 12,
  },
  dualButtonRow: {
    flexDirection: "row",
    gap: 10,
  },
  flexButton: {
    flex: 1,
    borderRadius: 12,
  },
  primaryButton: {
    borderRadius: 12,
  },
  actionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: 8,
    padding: 16,
    paddingBottom: Math.max(insets.bottom, 16),
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
  },
  singleAction: {
    flex: 1,
  },
  actionContent: {
    height: 48,
  },
  modal: {
    margin: 20,
    padding: 20,
    maxHeight: "88%",
    borderRadius: 14,
    gap: 12,
  },
  modalTitle: {
    fontWeight: "800",
  },
  itemsContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    paddingTop: 12,
    gap: 8,
  },
  itemsHeader: {
    color: theme.colors.onSurfaceVariant,
    fontWeight: "700",
    marginBottom: 4,
  },
  itemBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
    gap: 8,
  },
  extraItemBadgeRow: {
    borderLeftWidth: 3,
    borderLeftColor: activeColors.warning,
    backgroundColor: activeColors.warningBg,
  },
  itemBadgeTextContainer: {
    flex: 1,
    gap: 2,
  },
  itemBadgeName: {
    color: theme.colors.onSurface,
    fontWeight: "700",
  },
  itemBadgeUnit: {
    color: theme.colors.onSurfaceDisabled,
  },
  itemBadgeRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  itemBadgeQty: {
    color: theme.colors.onSurfaceVariant,
    fontWeight: "600",
  },
  itemBadgeTotal: {
    color: activeColors.primaryLight,
    fontWeight: "700",
  },
  extraBadge: {
    backgroundColor: activeColors.warning,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  extraBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
  },
  modalItemsScroll: {
    maxHeight: 180,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 12,
    padding: 8,
  },
  modalItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  addItemSection: {
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  modalTotalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  modalTotalText: {
    color: theme.colors.primary,
    fontWeight: "800",
  },
});
