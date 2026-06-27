import { useActiveColors } from '../../hooks/useActiveColors';
import { useMemo, useState } from 'react';
import { StyleSheet, View, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Button, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { CustomerCard, CustomerHeader, CustomerScreen, InlineMessage } from '../../components/customer/customer-ui';
import { Colors } from '../../constants/colors';
import { useAuthStore } from '../../features/auth/auth.store';
import { userApi } from '../../features/user/user.api';
import { getApiErrorMessage } from '../../lib/api-response';

type ProfileForm = {
  fullName: string;
  phone: string;
};

const VIETNAM_PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)\d{8}$/;

function validateProfileForm(form: ProfileForm) {
  if (form.fullName.trim().length < 2) return 'Họ tên cần tối thiểu 2 ký tự.';
  if (form.phone.trim() && !VIETNAM_PHONE_REGEX.test(form.phone.trim())) {
    return 'Số điện thoại chưa đúng định dạng Việt Nam.';
  }
  return '';
}

function getAvatarLabel(name?: string | null) {
  return (name?.trim() || 'K').charAt(0).toUpperCase();
}

export default function EditProfileScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const queryClient = useQueryClient();
  const { user, fetchProfile } = useAuthStore();
  const [form, setForm] = useState<ProfileForm>({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
  });
  const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState(false);

  const validationMessage = useMemo(() => validateProfileForm(form), [form]);
  const avatarUri = avatar?.uri || user?.avatarUrl || '';

  const updateForm = (patch: Partial<ProfileForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    setMessage('');
  };

  const pickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setMessageTone('error');
        setMessage('Bạn cần cấp quyền thư viện ảnh để chọn ảnh đại diện.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0]);
        Haptics.selectionAsync().catch(() => {});
      }
    } catch {
      setMessageTone('error');
      setMessage('Không thể mở thư viện ảnh. Vui lòng thử lại.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setMessageTone('error');
        setMessage('Bạn cần cấp quyền camera để chụp ảnh đại diện.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!result.canceled && result.assets[0]) {
        setAvatar(result.assets[0]);
        Haptics.selectionAsync().catch(() => {});
      }
    } catch {
      setMessageTone('error');
      setMessage('Không thể mở camera. Vui lòng thử lại.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const showAvatarSourceSelection = () => {
    setMessage('');
    Alert.alert('Đổi ảnh đại diện', 'Vui lòng chọn nguồn ảnh:', [
      { text: 'Chụp ảnh mới', onPress: takePhoto },
      { text: 'Chọn từ thư viện', onPress: pickFromGallery },
      { text: 'Đóng', style: 'cancel' },
    ]);
  };

  const submit = async () => {
    const error = validateProfileForm(form);
    if (error) {
      setMessageTone('error');
      setMessage(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('fullName', form.fullName.trim());
      formData.append('phone', form.phone.trim());
      if (avatar) {
        formData.append('avatar', {
          uri: avatar.uri,
          type: avatar.mimeType || 'image/jpeg',
          name: avatar.fileName || 'avatar.jpg',
        } as any);
      }
      await userApi.updateProfile(formData);
      await fetchProfile();
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAvatar(null);
      setMessageTone('success');
      setMessage('Đã cập nhật hồ sơ thành công.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err: any) {
      setMessageTone('error');
      setMessage(getApiErrorMessage(err, 'Không thể cập nhật hồ sơ.'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerScreen>
      <CustomerHeader title="Cập nhật hồ sơ" subtitle="Thông tin này dùng khi đặt dịch vụ và liên hệ nhà cung cấp" />
      {message ? <InlineMessage tone={messageTone} message={message} /> : null}

      <CustomerCard style={styles.avatarCard}>
        <View style={styles.avatarContainer}>
          <Pressable
            onPress={showAvatarSourceSelection}
            accessibilityRole="button"
            accessibilityLabel="Đổi ảnh đại diện"
            style={styles.avatarWrapper}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} contentFit="cover" transition={180} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarText}>{getAvatarLabel(form.fullName)}</Text>
              </View>
            )}
            <View style={styles.cameraBadge}>
              <MaterialCommunityIcons name="camera" size={18} color="#FFFFFF" />
            </View>
          </Pressable>
          <Text variant="titleMedium" style={styles.avatarLabel}>
            {avatar ? 'Ảnh đại diện mới đã chọn' : 'Chạm để đổi ảnh đại diện'}
          </Text>
          {avatar ? (
            <Button
              mode="outlined"
              compact
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setAvatar(null);
              }}
              textColor={activeColors.error}
              style={styles.resetAvatarButton}
            >
              Hủy ảnh đã chọn
            </Button>
          ) : null}
        </View>
      </CustomerCard>

      <CustomerCard>
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <TextInput
              label="Họ tên"
              mode="outlined"
              value={form.fullName}
              onChangeText={(fullName) => updateForm({ fullName })}
              autoCapitalize="words"
              textContentType="name"
              left={<TextInput.Icon icon="account-outline" color={activeColors.textSecondary} />}
              error={Boolean(validationMessage && form.fullName.trim().length < 2)}
              outlineStyle={styles.outlineStyle}
              style={styles.textInput}
            />
            {validationMessage && form.fullName.trim().length < 2 ? (
              <Text variant="bodySmall" style={styles.errorText}>
                Họ tên cần tối thiểu 2 ký tự.
              </Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              label="Số điện thoại"
              mode="outlined"
              value={form.phone}
              onChangeText={(phone) => updateForm({ phone })}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              left={<TextInput.Icon icon="phone-outline" color={activeColors.textSecondary} />}
              error={Boolean(form.phone.trim() && !VIETNAM_PHONE_REGEX.test(form.phone.trim()))}
              outlineStyle={styles.outlineStyle}
              style={styles.textInput}
            />
            {form.phone.trim() && !VIETNAM_PHONE_REGEX.test(form.phone.trim()) ? (
              <Text variant="bodySmall" style={styles.errorText}>
                Số điện thoại chưa đúng định dạng Việt Nam.
              </Text>
            ) : (
              <Text variant="bodySmall" style={styles.hintText}>
                Chúng tôi dùng số điện thoại này để liên hệ phục vụ.
              </Text>
            )}
          </View>

          <Button
            mode="contained"
            loading={loading}
            disabled={loading}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              submit();
            }}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            Lưu thay đổi
          </Button>
        </View>
      </CustomerCard>
    </CustomerScreen>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  avatarCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    alignSelf: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    borderRadius: 54,
    borderWidth: 4,
    borderColor: activeColors.primarySoft,
    backgroundColor: activeColors.surface,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarFallback: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: activeColors.primary,
  },
  avatarText: {
    color: activeColors.surface,
    fontSize: 40,
    fontWeight: '900',
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: activeColors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: activeColors.surface,
  },
  avatarLabel: {
    color: activeColors.textSecondary,
    fontWeight: '700',
  },
  resetAvatarButton: {
    borderRadius: 10,
    borderColor: activeColors.error,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 4,
  },
  outlineStyle: {
    borderRadius: 14,
  },
  textInput: {
    backgroundColor: activeColors.surface,
  },
  errorText: {
    color: activeColors.error,
    fontWeight: '700',
    marginLeft: 4,
  },
  hintText: {
    color: activeColors.textSecondary,
    marginLeft: 4,
  },
  saveButton: {
    borderRadius: 16,
    marginTop: 8,
    backgroundColor: activeColors.primary,
  },
  saveButtonContent: {
    height: 48,
  },
});
