import { useCallback, useState, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Alert } from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { bookingApi } from "../booking.api";
import { useAuthStore } from "../../auth/auth.store";
import { useNotificationStore } from "../../notification/notification.store";
import { getTrackingSocket } from "../../../lib/socket";
import type { BookingTimelineItem } from "../components/BookingTimelineSection";

export type ImageSetter = Dispatch<SetStateAction<ImagePicker.ImagePickerAsset[]>>;
export type MessageState = {
  tone: "success" | "warning" | "error" | "info";
  text: string;
} | null;

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function useProviderBookingDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const bookingSignal = useNotificationStore((state) => state.bookingSignal);

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [timeline, setTimeline] = useState<BookingTimelineItem[]>([]);

  // Modal quote
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteEstimatedTime, setQuoteEstimatedTime] = useState("");
  const [quoteNote, setQuoteNote] = useState("");
  const [quoteError, setQuoteError] = useState("");
  const [surveyImages, setSurveyImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [quoteItems, setQuoteItems] = useState<{ name: string; unit: string; price: number; quantity: number }[]>([]);

  // Item form inputs
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemQty, setNewItemQty] = useState("1");

  // Modal surveyor
  const [surveyorName, setSurveyorName] = useState("");
  const [surveyorPhone, setSurveyorPhone] = useState("");

  // Modal cancel
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  // Modal supp quote
  const [showSuppQuoteModal, setShowSuppQuoteModal] = useState(false);
  const [suppQuoteNote, setSuppQuoteNote] = useState("");
  const [suppQuoteError, setSuppQuoteError] = useState("");
  const [suppQuoteItems, setSuppQuoteItems] = useState<{ name: string; unit: string; price: number; quantity: number }[]>([]);

  // Result images
  const [resultImages, setResultImages] = useState<ImagePicker.ImagePickerAsset[]>([]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 0);

  const requireKyc = (action: () => void) => {
    if (user?.kycStatus !== "APPROVED") {
      Alert.alert(
        "Yêu cầu xác thực",
        "Vui lòng hoàn tất hồ sơ và xác minh CCCD để có thể nhận việc hoặc báo giá.",
        [
          { text: "Đóng", style: "cancel" },
          { text: "Xác thực ngay", onPress: () => router.push("/profile/kyc") },
        ]
      );
      return;
    }
    action();
  };

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

  useFocusEffect(
    useCallback(() => {
      fetchBooking();
    }, [fetchBooking])
  );

  useFocusEffect(
    useCallback(() => {
      if (bookingSignal?.bookingId === Number(id)) {
        void fetchBooking();
      }
    }, [bookingSignal, fetchBooking, id])
  );

  // Optimized GPS Tracking: Only run when technician is executing confirmed or in-progress orders
  useEffect(() => {
    if (!booking?.id || !booking?.status) return;
    const trackableStatuses = ["CONFIRMED", "IN_PROGRESS"];
    if (!trackableStatuses.includes(booking.status)) return;

    let isMounted = true;
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        if (!isMounted) return;

        const socket = await getTrackingSocket();

        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 15,
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

        if (!isMounted) {
          sub.remove();
        } else {
          locationSubscription = sub;
        }
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
          }))
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setMessage(null);
    await fetchBooking();
    setRefreshing(false);
  }, [fetchBooking]);

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
    setResultImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    setMessage(null);
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty < 1) return;
    setQuoteItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, quantity: newQty } : item))
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

    if (!name || !unit || isNaN(price) || price <= 0) {
      setQuoteError("Vui lòng nhập đầy đủ tên, đơn vị và đơn giá hợp lệ.");
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
      prev.map((item, idx) => (idx === index ? { ...item, quantity: newQty } : item))
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

    if (!name || !unit || isNaN(price) || price <= 0) {
      setSuppQuoteError("Vui lòng nhập đầy đủ tên, đơn vị và đơn giá hợp lệ.");
      return;
    }

    setSuppQuoteItems((prev) => [...prev, { name, unit, price, quantity: qty }]);
    setNewItemName("");
    setNewItemUnit("");
    setNewItemPrice("");
    setNewItemQty("1");
    setSuppQuoteError("");
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
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setMessage({
                tone: "success",
                text: "Đã nhận đơn hàng. Vui lòng cập nhật thợ khảo sát.",
              });
              await fetchBooking();
            } catch (err: any) {
              setMessage({
                tone: "error",
                text: err?.response?.data?.error?.message || "Không thể nhận đơn hàng.",
              });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
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
                text: err?.response?.data?.error?.message || "Không thể từ chối đơn hàng.",
              });
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
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
    if (!quoteEstimatedTime.trim() || quoteEstimatedTime.trim().length > 100) {
      setQuoteError("Vui lòng nhập thời gian dự kiến (tối đa 100 ký tự).");
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
      setQuoteError(err?.response?.data?.error?.message || "Gửi báo giá thất bại.");
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
      setSuppQuoteError(err?.response?.data?.error?.message || "Gửi báo giá phát sinh thất bại.");
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
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setMessage({ tone: "success", text: "Đã bắt đầu thực hiện đơn hàng." });
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
      if (status !== "granted") {
        Alert.alert("Lỗi", "Cần cấp quyền vị trí để xác nhận.");
        setActionLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const fullAddress = [booking.addressDetail, booking.ward, booking.district, booking.province]
        .filter(Boolean)
        .filter((p) => p !== "Không áp dụng")
        .join(", ");

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
        if (dist > 0.5) shouldWarn = true;
      } else {
        shouldWarn = true;
      }

      const proceedArrive = async () => {
        try {
          setActionLoading(true);
          await bookingApi.arriveAtLocation(Number(id));
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await fetchBooking();
          setMessage({ tone: "success", text: "Đã báo đến nơi" });
        } catch (err: any) {
          setMessage({ tone: "error", text: err?.response?.data?.error?.message || "Báo đến nơi thất bại" });
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
      setCancelError(err?.response?.data?.error?.message || "Hủy đơn thất bại.");
    } finally {
      setActionLoading(false);
    }
  };

  return {
    id,
    booking,
    loading,
    actionLoading,
    refreshing,
    message,
    timeline,
    formatPrice,
    requireKyc,
    onRefresh,
    fetchBooking,
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
    setQuoteItems,
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
    setSuppQuoteItems,
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
  };
}

