/**
 * Profile edit form.
 */
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { Avatar, Button, IconButton, TextInput, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { profileApi } from '../../features/profile/profile.api';
import { useAuthStore } from '../../features/auth/auth.store';
import { Colors } from '../../constants/colors';
import {
  ProviderCard,
  ProviderInlineMessage,
  ProviderPageHeader,
  ProviderSectionHeader,
} from '../../components/provider/provider-ui';

export default function ProfileEditScreen() {
  const theme = useTheme();
  const activeColors = theme.dark ? Colors.dark : Colors.light;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, fetchProfile } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: 'warning' | 'error'; text: string } | null>(null);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const pickAvatar = async () => {
    Alert.alert(
      'Chọn ảnh đại diện',
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
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.75,
            });
            if (!result.canceled) {
              setAvatar(result.assets[0]);
              setMessage(null);
            }
          },
        },
        {
          text: 'Chọn từ Thư viện',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.75,
            });
            if (!result.canceled) {
              setAvatar(result.assets[0]);
              setMessage(null);
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!fullName.trim() || !phone.trim()) {
      setMessage({ tone: 'warning', text: 'Vui lòng nhập đầy đủ họ tên và số điện thoại.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      formData.append('phone', phone.trim());

      if (avatar) {
        formData.append('avatar', { uri: avatar.uri, name: 'avatar.jpg', type: 'image/jpeg' } as any);
      }

      await profileApi.updateProfile(formData);
      await fetchProfile();
      router.back();
    } catch (err: any) {
      setMessage({ tone: 'error', text: err?.response?.data?.error?.message || 'Không thể cập nhật hồ sơ.' });
    } finally {
      setLoading(false);
    }
  };

  const avatarUri = avatar?.uri || user?.avatarUrl;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]} contentInsetAdjustmentBehavior="automatic">
        <ProviderPageHeader
          title="Chỉnh sửa hồ sơ"
          subtitle="Cập nhật thông tin liên hệ hiển thị cho khách hàng."
          action={<IconButton icon="arrow-left" mode="contained-tonal" onPress={() => router.back()} accessibilityLabel="Quay lại" />}
        />

        {message && <ProviderInlineMessage tone={message.tone} message={message.text} />}

        <ProviderCard contentStyle={styles.avatarCard}>
          {avatarUri ? (
            <Avatar.Image size={92} source={{ uri: avatarUri }} />
          ) : (
            <Avatar.Text
              size={92}
              label={user?.fullName?.charAt(0)?.toUpperCase() || 'P'}
              color={activeColors.primary}
              style={[styles.avatarFallback, { backgroundColor: `${activeColors.primary}14` }]}
            />
          )}
          <Button mode="outlined" onPress={pickAvatar} style={styles.avatarButton} icon="camera-outline">
            Thay đổi ảnh đại diện
          </Button>
        </ProviderCard>

        <ProviderCard contentStyle={styles.formSection}>
          <ProviderSectionHeader title="Thông tin cá nhân" />
          <TextInput label="Email" value={user?.email || ''} disabled mode="outlined" style={[styles.input, { backgroundColor: theme.colors.surface }]} />
          <TextInput
            label="Họ và tên"
            value={fullName}
            onChangeText={value => {
              setFullName(value);
              setMessage(null);
            }}
            mode="outlined"
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            accessibilityLabel="Họ và tên"
          />
          <TextInput
            label="Số điện thoại"
            value={phone}
            onChangeText={value => {
              setPhone(value);
              setMessage(null);
            }}
            mode="outlined"
            keyboardType="phone-pad"
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            accessibilityLabel="Số điện thoại"
          />
        </ProviderCard>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || (!fullName.trim() && !phone.trim() && !avatar)}
          style={styles.submitButton}
          contentStyle={styles.submitContent}
        >
          {loading ? 'Đang xử lý…' : 'Lưu thay đổi'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  avatarCard: {
    alignItems: 'center',
    gap: 12,
  },
  avatarFallback: {
  },
  avatarButton: {
    borderRadius: 999,
  },
  formSection: {
    gap: 12,
  },
  input: {
  },
  submitButton: {
    borderRadius: 12,
  },
  submitContent: {
    height: 50,
  },
});
