/**
 * Change password screen.
 */
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Button, TextInput, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../features/auth/auth.api';
import { Colors } from '../../constants/colors';
import {
  ProviderCard,
  ProviderInlineMessage,
  ProviderPageHeader,
  ProviderSectionHeader,
} from '../../components/provider/provider-ui';

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: 'warning' | 'error'; text: string } | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const validate = () => {
    if (!oldPassword || !newPassword || !confirmPassword) return 'Vui lòng nhập đầy đủ thông tin.';
    if (newPassword !== confirmPassword) return 'Mật khẩu mới không khớp.';
    if (newPassword.length < 6) return 'Mật khẩu mới phải có ít nhất 6 ký tự.';
    return '';
  };

  const handleSubmit = async () => {
    const validationMessage = validate();
    if (validationMessage) {
      setMessage({ tone: 'warning', text: validationMessage });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await authApi.changePassword({ currentPassword: oldPassword, newPassword });
      router.back();
    } catch (err: any) {
      setMessage({ tone: 'error', text: err?.response?.data?.error?.message || 'Không thể đổi mật khẩu.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]} contentInsetAdjustmentBehavior="automatic">
        <ProviderPageHeader
          title="Đổi mật khẩu"
          subtitle="Dùng mật khẩu mạnh để bảo vệ tài khoản provider."
          onBack={() => router.back()}
        />

        {message && <ProviderInlineMessage tone={message.tone} message={message.text} />}

        <ProviderCard contentStyle={styles.formSection}>
          <ProviderSectionHeader title="Bảo mật" />
          <TextInput
            label="Mật khẩu hiện tại"
            value={oldPassword}
            onChangeText={value => {
              setOldPassword(value);
              setMessage(null);
            }}
            secureTextEntry={!showOldPass}
            right={
              <TextInput.Icon
                icon={showOldPass ? 'eye-off' : 'eye'}
                onPress={() => setShowOldPass(value => !value)}
                accessibilityLabel={showOldPass ? 'Ẩn mật khẩu hiện tại' : 'Hiện mật khẩu hiện tại'}
              />
            }
            mode="outlined"
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            accessibilityLabel="Mật khẩu hiện tại"
          />
          <TextInput
            label="Mật khẩu mới"
            value={newPassword}
            onChangeText={value => {
              setNewPassword(value);
              setMessage(null);
            }}
            secureTextEntry={!showNewPass}
            right={
              <TextInput.Icon
                icon={showNewPass ? 'eye-off' : 'eye'}
                onPress={() => setShowNewPass(value => !value)}
                accessibilityLabel={showNewPass ? 'Ẩn mật khẩu mới' : 'Hiện mật khẩu mới'}
              />
            }
            mode="outlined"
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            accessibilityLabel="Mật khẩu mới"
          />
          <TextInput
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChangeText={value => {
              setConfirmPassword(value);
              setMessage(null);
            }}
            secureTextEntry={!showNewPass}
            mode="outlined"
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            accessibilityLabel="Xác nhận mật khẩu mới"
          />
        </ProviderCard>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !oldPassword || !newPassword || !confirmPassword}
          style={styles.submitButton}
          contentStyle={styles.submitContent}
        >
          {loading ? 'Đang xử lý…' : 'Đổi mật khẩu'}
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
