/**
 * KYC Form - upload CCCD and portrait.
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import type { ComponentProps, Dispatch, SetStateAction } from 'react';
import { Image, StyleSheet, View, Alert, Modal, Dimensions } from 'react-native';
import { Button, IconButton, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { CameraView, useCameraPermissions } from 'expo-camera';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { profileApi } from '../../features/profile/profile.api';
import { useAuthStore } from '../../features/auth/auth.store';
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
  const activeColors = theme.dark ? Colors.dark : Colors.light;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [nfcStatus, setNfcStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
  const [message, setMessage] = useState<MessageState>(null);

  const [cccdFront, setCccdFront] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [cccdBack, setCccdBack] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [portrait, setPortrait] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const [cameraVisible, setCameraVisible] = useState(false);
  const [cameraType, setCameraType] = useState<'cccd' | 'portrait'>('cccd');
  const [cameraSetter, setCameraSetter] = useState<ImageSetter | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    // Initialize NFC
    NfcManager.start().catch((err) => console.warn('NFC start error', err));
    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let intervalId: NodeJS.Timeout;

      const checkStatus = async () => {
        try {
          const res = await profileApi.getKycStatus();
          const newStatus = res.data?.data?.status || null;
          setKycStatus(newStatus);
          
          // Stop polling if status is no longer PENDING
          if (newStatus !== 'PENDING' && intervalId) {
            clearInterval(intervalId);
          }
        } catch {
          setKycStatus(null);
        } finally {
          setLoading(false);
        }
      };

      // Initial check
      checkStatus();

      // Poll every 5 seconds only if we don't know the status yet or it's PENDING
      // Wait, we need the latest state of kycStatus. Since useCallback has no dependencies on kycStatus,
      // the best approach is to always poll and let the server response clear the interval if it's no longer pending.
      intervalId = setInterval(checkStatus, 5000);

      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    }, []),
  );

  const pickImage = async (setter: ImageSetter, type: 'cccd' | 'portrait') => {
    if (!permission?.granted) {
      const req = await requestPermission();
      if (!req.granted) {
        Alert.alert('Quyền truy cập', 'Vui lòng cho phép truy cập camera để chụp ảnh.');
        return;
      }
    }
    setCameraType(type);
    setCameraSetter(() => setter);
    setCameraVisible(true);
  };

  const handleScanNFC = async () => {
    if (!cccdFront || !cccdBack || !portrait) {
      setMessage({ tone: 'warning', text: 'Vui lòng tải đủ 3 ảnh trước khi quét NFC.' });
      return;
    }
    
    // Check if NFC is supported
    const isSupported = await NfcManager.isSupported();
    if (!isSupported) {
      setMessage({ tone: 'error', text: 'Thiết bị của bạn không hỗ trợ NFC.' });
      return;
    }

    setNfcStatus('SCANNING');
    setMessage({ tone: 'success', text: 'Đang chờ thẻ... Hãy áp thẻ CCCD vào mặt lưng điện thoại của bạn.' });
    
    try {
      await NfcManager.requestTechnology(NfcTech.IsoDep);
      const tag = await NfcManager.getTag();
      
      if (tag) {
        setNfcStatus('SUCCESS');
        setMessage({ tone: 'success', text: `Quét NFC thành công! UID: ${tag.id || 'N/A'}` });
      }
    } catch (ex: any) {
      setNfcStatus('IDLE');
      if (ex !== 'cancelled') {
        setMessage({ tone: 'error', text: 'Lỗi đọc thẻ NFC. Vui lòng thử lại.' });
      } else {
        setMessage(null);
      }
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
  };

  const handleSubmit = async () => {
    if (!cccdFront || !cccdBack || !portrait || nfcStatus !== 'SUCCESS') {
      setMessage({ tone: 'warning', text: 'Vui lòng hoàn tất tải ảnh và quét NFC.' });
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
      useAuthStore.getState().fetchProfile();
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
          <View style={[styles.statusIcon, { backgroundColor: `${activeColors.success}16` }]}>
            <MaterialCommunityIcons name="check-decagram" size={34} color={activeColors.success} />
          </View>
          <Text variant="titleMedium" style={[styles.statusTitle, { color: activeColors.success }]}>
            Hồ sơ đã được duyệt
          </Text>
          <Text variant="bodyMedium" style={[styles.statusDescription, { color: theme.colors.onSurfaceVariant }]}>
            Tài khoản của bạn đã được xác minh và có thể dùng đầy đủ tính năng của nhà cung cấp.
          </Text>
        </ProviderCard>
      );
    }

    if (kycStatus === 'PENDING') {
      return (
        <ProviderCard contentStyle={styles.statusCard}>
          <View style={[styles.statusIcon, { backgroundColor: `${activeColors.warning}18` }]}>
            <MaterialCommunityIcons name="timer-sand" size={34} color={activeColors.warning} />
          </View>
          <Text variant="titleMedium" style={[styles.statusTitle, { color: activeColors.warning }]}>
            Đang chờ duyệt
          </Text>
          <Text variant="bodyMedium" style={[styles.statusDescription, { color: theme.colors.onSurfaceVariant }]}>
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
        <View style={[styles.uploadIcon, { backgroundColor: asset ? `${activeColors.success}14` : theme.colors.surfaceVariant }]}>
          <MaterialCommunityIcons name={asset ? 'check-circle-outline' : icon} size={24} color={asset ? activeColors.success : theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyLarge" style={[styles.uploadTitle, { color: theme.colors.onSurface }]}>
            {title}
          </Text>
          <Text variant="bodySmall" style={[styles.uploadDescription, { color: theme.colors.onSurfaceVariant }]}>
            {asset ? 'Đã chọn ảnh. Chạm để thay ảnh khác.' : description}
          </Text>
        </View>
      </View>
      {asset ? <Image source={{ uri: asset.uri }} style={[styles.previewImage, { backgroundColor: theme.colors.surfaceVariant }]} /> : null}
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
              color={kycStatus === 'REJECTED' ? activeColors.error : theme.colors.onSurfaceVariant}
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
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Ảnh cần chuẩn bị
            </Text>
            <Text variant="bodySmall" style={[styles.sectionDescription, { color: theme.colors.onSurfaceVariant }]}>
              Ảnh nên đủ sáng, không bị che góc. Chỉ dùng ảnh của chính bạn và ảnh chân dung cần có cầm CCCD.
            </Text>
          </ProviderCard>

          {renderUploadCard({
            title: 'CCCD mặt trước',
            description: 'Ảnh rõ toàn bộ mặt trước CCCD.',
            asset: cccdFront,
            icon: 'card-account-details-outline',
            onPress: () => pickImage(setCccdFront, 'cccd'),
          })}
          {renderUploadCard({
            title: 'CCCD mặt sau',
            description: 'Ảnh rõ mã QR và thông tin mặt sau.',
            asset: cccdBack,
            icon: 'card-bulleted-outline',
            onPress: () => pickImage(setCccdBack, 'cccd'),
          })}
          {renderUploadCard({
            title: 'Ảnh chân dung',
            description: 'Ảnh chụp chân dung có cầm CCCD sát mặt.',
            asset: portrait,
            icon: 'face-recognition',
            onPress: () => pickImage(setPortrait, 'portrait'),
          })}

          <ProviderCard 
            onPress={handleScanNFC} 
            contentStyle={[styles.uploadContent, nfcStatus === 'SCANNING' && { opacity: 0.7 }]}
            style={(!cccdFront || !cccdBack || !portrait) ? { opacity: 0.5 } : {}}
          >
            <View style={styles.uploadText}>
              <View style={[styles.uploadIcon, { backgroundColor: nfcStatus === 'SUCCESS' ? `${activeColors.success}14` : nfcStatus === 'SCANNING' ? `${activeColors.warning}14` : theme.colors.surfaceVariant }]}>
                <MaterialCommunityIcons 
                  name={nfcStatus === 'SUCCESS' ? 'nfc-tap' : nfcStatus === 'SCANNING' ? 'nfc-search-variant' : 'nfc'} 
                  size={24} 
                  color={nfcStatus === 'SUCCESS' ? activeColors.success : nfcStatus === 'SCANNING' ? activeColors.warning : theme.colors.primary} 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyLarge" style={[styles.uploadTitle, { color: theme.colors.onSurface }]}>
                  Quét chip CCCD (NFC)
                </Text>
                <Text variant="bodySmall" style={[styles.uploadDescription, { color: theme.colors.onSurfaceVariant }]}>
                  {nfcStatus === 'SUCCESS' ? 'Đã trích xuất dữ liệu thành công.' : nfcStatus === 'SCANNING' ? 'Đang đọc thẻ...' : 'Áp sát thẻ CCCD vào lưng máy.'}
                </Text>
              </View>
            </View>
          </ProviderCard>

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={submitting}
            disabled={submitting || !cccdFront || !cccdBack || !portrait || nfcStatus !== 'SUCCESS'}
            style={styles.submitButton}
            contentStyle={styles.buttonContent}
          >
            {submitting ? 'Đang gửi…' : 'Gửi hồ sơ xét duyệt'}
          </Button>
        </>
      )}

      {/* Custom Camera Modal */}
      <Modal visible={cameraVisible} animationType="slide" transparent={false}>
        <CameraView 
          style={{ flex: 1 }} 
          facing={cameraType === 'portrait' ? 'front' : 'back'} 
          ref={cameraRef}
        >
          {/* Top mask */}
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          {/* Center mask row */}
          <View style={{ flexDirection: 'row', height: cameraType === 'cccd' ? 220 : 350 }}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
            <View style={{ 
              width: cameraType === 'cccd' ? 340 : 250, 
              backgroundColor: 'transparent', 
              borderColor: '#2563eb', 
              borderWidth: 2, 
              borderRadius: cameraType === 'cccd' ? 16 : 125,
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', padding: 20 }}>
                {cameraType === 'cccd' ? 'Căn chỉnh CCCD vào trong khung này' : 'Căn chỉnh khuôn mặt vào trong khung này'}
              </Text>
            </View>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />
          </View>
          {/* Bottom mask */}
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} />

          {/* Controls Overlay */}
          <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            <IconButton icon="close" size={36} iconColor="white" onPress={() => setCameraVisible(false)} />
            <IconButton icon="circle-slice-8" size={80} iconColor="white" onPress={async () => {
              if (cameraRef.current && cameraSetter) {
                const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
                if (photo) {
                  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
                  const cropW = cameraType === 'cccd' ? 340 : 250;
                  const cropH = cameraType === 'cccd' ? 220 : 350;
                  
                  const originX = (photo.width * ((SCREEN_WIDTH - cropW) / 2)) / SCREEN_WIDTH;
                  const originY = (photo.height * ((SCREEN_HEIGHT - cropH) / 2)) / SCREEN_HEIGHT;
                  const width = (photo.width * cropW) / SCREEN_WIDTH;
                  const height = (photo.height * cropH) / SCREEN_HEIGHT;

                  try {
                    const cropped = await ImageManipulator.manipulateAsync(
                      photo.uri,
                      [{ crop: { originX, originY, width, height } }],
                      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
                    );
                    cameraSetter(cropped as any);
                  } catch (error) {
                    console.warn("Crop failed, using original", error);
                    cameraSetter(photo as any);
                  }
                  
                  setCameraVisible(false);
                }
              }
            }} />
            <View style={{ width: 68 }} />
          </View>
        </CameraView>
      </Modal>
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
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '800',
  },
  sectionDescription: {
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
    fontWeight: '800',
  },
  uploadDescription: {
    lineHeight: 18,
    marginTop: 2,
  },
  previewImage: {
    width: '100%',
    height: 168,
    borderRadius: 12,
  },
  submitButton: {
    borderRadius: 12,
  },
  buttonContent: {
    height: 50,
  },
});
