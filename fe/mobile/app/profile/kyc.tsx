/**
 * KYC Form - upload CCCD and portrait.
 */
import { useEffect, useState } from 'react';
import type { ComponentProps, Dispatch, SetStateAction } from 'react';
import { Image, StyleSheet, View, Alert } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { profileApi } from '../../features/profile/profile.api';
import { Colors } from '../../constants/colors';
import {
  ProviderCard,
  ProviderInlineMessage,
  ProviderLoadingState,
  ProviderPageHeader,
  ProviderScreen,
  ProviderStatusChip,
} from '../../components/provider/provider-ui';

type ImageSetter = Dispatch<SetStateAction<ImagePicker.ImagePickerAsset | null>>;
type MessageState = {
  tone: 'success' | 'warning' | 'error' | 'info';
  text: string;
} | null;

export default function KycScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState>(null);

  const [cccdFront, setCccdFront] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [cccdBack, setCccdBack] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [portrait, setPortrait] = useState<ImagePicker.ImagePickerAsset | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await profileApi.getKycStatus();
        setKycStatus(res.data?.data?.status || null);
      } catch {
        setKycStatus(null);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, []);

  const pickImage = async (setter: ImageSetter) => {
    Alert.alert(
      'Chọn ảnh',
      'Vui lòng chọn nguồn ảnh hoặc chụp ảnh mới.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chụp ảnh mới',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Quyền truy cập', 'Vui lòng cho phép truy cập camera để chụp ảnh.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              quality: 0.75,
            });
            if (!result.canceled) {
              setter(result.assets[0]);
              setMessage(null);
            }
          },
        },
        {
          text: 'Chọn từ Thư viện',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              quality: 0.75,
            });
            if (!result.canceled) {
              setter(result.assets[0]);
              setMessage(null);
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!cccdFront || !cccdBack || !portrait) {
      setMessage({ tone: 'warning', text: 'Vui lòng tải đủ CCCD mặt trước, mặt sau và ảnh chân dung.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('cccdFront', { uri: cccdFront.uri, name: 'cccd_front.jpg', type: 'image/jpeg' } as any);
      formData.append('cccdBack', { uri: cccdBack.uri, name: 'cccd_back.jpg', type: 'image/jpeg' } as any);
      formData.append('portrait', { uri: portrait.uri, name: 'portrait.jpg', type: 'image/jpeg' } as any);

      await profileApi.submitKyc(formData);
      setKycStatus('PENDING');
      setMessage({ tone: 'success', text: 'Đã nộp hồ sơ KYC. Vui lòng chờ duyệt trong 1-2 ngày làm việc.' });
    } catch (err: any) {
      setMessage({
        tone: 'error',
        text: err?.response?.data?.error?.message || 'Không thể nộp hồ sơ KYC. Vui lòng thử lại.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusCard = () => {
    if (kycStatus === 'APPROVED') {
      return (
        <ProviderCard contentStyle={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: `${Colors.light.success}16` }]}>
            <MaterialCommunityIcons name="check-decagram" size={34} color={Colors.light.success} />
          </View>
          <Text variant="titleMedium" style={[styles.statusTitle, { color: Colors.light.success }]}>
            Hồ sơ đã được duyệt
          </Text>
          <Text variant="bodyMedium" style={styles.statusDescription}>
            Tài khoản của bạn đã được xác minh và có thể dùng đầy đủ tính năng của nhà cung cấp.
          </Text>
        </ProviderCard>
      );
    }

    if (kycStatus === 'PENDING') {
      return (
        <ProviderCard contentStyle={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: `${Colors.light.warning}18` }]}>
            <MaterialCommunityIcons name="timer-sand" size={34} color={Colors.light.warning} />
          </View>
          <Text variant="titleMedium" style={[styles.statusTitle, { color: Colors.light.warning }]}>
            Đang chờ duyệt
          </Text>
          <Text variant="bodyMedium" style={styles.statusDescription}>
            Hồ sơ KYC của bạn đang được xét duyệt. Quá trình này thường mất từ 1-2 ngày làm việc.
          </Text>
        </ProviderCard>
      );
    }

    return null;
  };

  const renderUploadCard = ({
    title,
    description,
    asset,
    icon,
    onPress,
  }: {
    title: string;
    description: string;
    asset: ImagePicker.ImagePickerAsset | null;
    icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
    onPress: () => void;
  }) => (
    <ProviderCard onPress={onPress} accessibilityLabel={title} contentStyle={styles.uploadContent}>
      <View style={styles.uploadText}>
        <View style={[styles.uploadIcon, { backgroundColor: asset ? `${Colors.light.success}14` : Colors.light.surfaceVariant }]}>
          <MaterialCommunityIcons name={asset ? 'check-circle-outline' : icon} size={24} color={asset ? Colors.light.success : theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyLarge" style={styles.uploadTitle}>
            {title}
          </Text>
          <Text variant="bodySmall" style={styles.uploadDescription}>
            {asset ? 'Đã chọn ảnh. Chạm để thay ảnh khác.' : description}
          </Text>
        </View>
      </View>
      {asset ? <Image source={{ uri: asset.uri }} style={styles.previewImage} /> : null}
    </ProviderCard>
  );

  if (loading) {
    return (
      <ProviderScreen>
        <ProviderLoadingState label="Đang tải trạng thái KYC…" />
      </ProviderScreen>
    );
  }

  const statusCard = renderStatusCard();

  return (
    <ProviderScreen scroll contentStyle={styles.content}>
      <ProviderPageHeader
        title="Xác thực tài khoản"
        subtitle="Tải ảnh CCCD và chân dung rõ nét để hoàn tất KYC."
        action={<IconButton icon="arrow-left" mode="contained-tonal" onPress={() => router.back()} accessibilityLabel="Quay lại" />}
      />

      {message && <ProviderInlineMessage tone={message.tone} message={message.text} />}

      {statusCard || (
        <>
          <View style={styles.statusRow}>
            <ProviderStatusChip
              label={kycStatus === 'REJECTED' ? 'Bị từ chối' : 'Chưa nộp hồ sơ'}
              color={kycStatus === 'REJECTED' ? Colors.light.error : Colors.light.textSecondary}
            />
          </View>

          {kycStatus === 'REJECTED' && (
            <ProviderInlineMessage
              tone="error"
              icon="alert-circle-outline"
              message="Hồ sơ trước đó bị từ chối. Vui lòng kiểm tra ảnh rõ nét và nộp lại."
            />
          )}

          <ProviderCard>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Ảnh cần chuẩn bị
            </Text>
            <Text variant="bodySmall" style={styles.sectionDescription}>
              Ảnh nên đủ sáng, không bị che góc, chữ trên CCCD đọc được. Chỉ dùng ảnh của chính bạn.
            </Text>
          </ProviderCard>

          {renderUploadCard({
            title: 'CCCD mặt trước',
            description: 'Ảnh rõ toàn bộ mặt trước CCCD.',
            asset: cccdFront,
            icon: 'card-account-details-outline',
            onPress: () => pickImage(setCccdFront),
          })}
          {renderUploadCard({
            title: 'CCCD mặt sau',
            description: 'Ảnh rõ mã QR và thông tin mặt sau.',
            asset: cccdBack,
            icon: 'card-bulleted-outline',
            onPress: () => pickImage(setCccdBack),
          })}
          {renderUploadCard({
            title: 'Ảnh chân dung',
            description: 'Ảnh khuôn mặt rõ, không đeo kính tối.',
            asset: portrait,
            icon: 'face-recognition',
            onPress: () => pickImage(setPortrait),
          })}

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || !cccdFront || !cccdBack || !portrait}
            style={styles.submitButton}
            contentStyle={styles.buttonContent}
          >
            {submitting ? 'Đang gửi…' : 'Gửi hồ sơ xét duyệt'}
          </Button>
        </>
      )}
    </ProviderScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },
  statusRow: {
    alignSelf: 'flex-start',
  },
  statusCard: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  statusIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontWeight: '800',
  },
  statusDescription: {
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  sectionDescription: {
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginTop: 6,
  },
  uploadContent: {
    gap: 12,
  },
  uploadText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadTitle: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  uploadDescription: {
    color: Colors.light.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  previewImage: {
    width: '100%',
    height: 168,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceVariant,
  },
  submitButton: {
    borderRadius: 12,
  },
  buttonContent: {
    height: 50,
  },
});
