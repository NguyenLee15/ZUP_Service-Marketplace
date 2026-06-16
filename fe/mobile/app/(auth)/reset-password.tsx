import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProviderAuthScreen, ProviderAuthCard, ProviderInlineMessage } from '../../components/provider/ProviderAuthLayout';
import { Colors } from '../../constants/colors';
import { authApi } from '../../features/auth/auth.api';
import { routes } from '../../lib/route-utils';

type ApiErrorLike = {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
      message?: string;
    };
  };
};

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email: string; otp: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ các trường');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu mới phải từ 6 ký tự trở lên');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Gọi API reset password với token chính là mã OTP đã verify
      await authApi.resetPassword({
        token: params.otp || '',
        newPassword: password,
      });

      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err: unknown) {
      const candidate = err as ApiErrorLike;
      const msg = candidate.response?.data?.error?.message || candidate.response?.data?.message;
      setError(msg || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <ProviderAuthScreen contentStyle={styles.content} scroll={false}>
        <ProviderAuthCard style={styles.successCard} contentStyle={styles.successCardContent}>
          <View style={styles.successIconWrapper}>
            <View style={[styles.successIconOuter, { backgroundColor: `${theme.colors.primary}16` }]}>
              <MaterialCommunityIcons name="check-circle-outline" size={54} color={theme.colors.primary} />
            </View>
          </View>

          <Text variant="headlineSmall" style={[styles.successTitle, { color: theme.colors.onSurface }]}>
            Thành công!
          </Text>

          <Text variant="bodyMedium" style={[styles.successDescription, { color: theme.colors.onSurfaceVariant }]}>
            Mật khẩu mới của bạn đã được thiết lập thành công. Vui lòng quay lại màn hình đăng nhập để tiếp tục.
          </Text>

          <Button
            mode="contained"
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.replace(routes.auth.login);
            }}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor={theme.colors.primary}
          >
            Quay lại Đăng nhập
          </Button>
        </ProviderAuthCard>
      </ProviderAuthScreen>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
    >
      <ProviderAuthScreen contentStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                router.back();
              }}
              style={[styles.backButton, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color={theme.colors.onSurface} />
            </Pressable>
            <View style={{ flex: 1 }} />
          </View>

          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
            Đặt lại mật khẩu
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Nhập mật khẩu mới có độ bảo mật cao để bảo vệ tài khoản đối tác của bạn.
          </Text>
        </View>

        <ProviderAuthCard contentStyle={styles.cardContent}>
          {error ? <ProviderInlineMessage tone="error" message={error} /> : null}

          <View style={styles.inputContainer}>
            <TextInput
              label="Mật khẩu mới"
              mode="outlined"
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                setError('');
              }}
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock-outline" color={theme.colors.primary} />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  color={theme.colors.onSurfaceVariant}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setShowPassword((value) => !value);
                  }}
                />
              }
              error={Boolean(error)}
              disabled={loading}
              returnKeyType="next"
              outlineStyle={styles.inputOutline}
              outlineColor={theme.colors.outlineVariant}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              style={{ backgroundColor: theme.colors.surface }}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              label="Xác nhận mật khẩu mới"
              mode="outlined"
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                setError('');
              }}
              secureTextEntry={!showConfirmPassword}
              left={<TextInput.Icon icon="lock-check-outline" color={theme.colors.primary} />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  color={theme.colors.onSurfaceVariant}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setShowConfirmPassword((value) => !value);
                  }}
                />
              }
              error={Boolean(error)}
              disabled={loading}
              returnKeyType="done"
              onSubmitEditing={handleResetPassword}
              outlineStyle={styles.inputOutline}
              outlineColor={theme.colors.outlineVariant}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              style={{ backgroundColor: theme.colors.surface }}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleResetPassword}
            loading={loading}
            disabled={loading || !password.trim() || !confirmPassword.trim()}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor={theme.colors.primary}
          >
            Cập nhật mật khẩu
          </Button>
        </ProviderAuthCard>
      </ProviderAuthScreen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24, gap: 20 },
  header: { gap: 8, marginBottom: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { lineHeight: 22, fontSize: 14 },
  cardContent: { gap: 8, paddingVertical: 8 },
  inputContainer: { marginBottom: 2 },
  inputOutline: { borderRadius: 14 },
  primaryButton: { borderRadius: 14, marginTop: 8 },
  buttonContent: { height: 54 },
  buttonLabel: { fontSize: 16, fontWeight: '800' },

  // Success view styling
  successCard: { borderRadius: 24, paddingVertical: 24 },
  successCardContent: { alignItems: 'center', gap: 16, paddingHorizontal: 12 },
  successIconWrapper: { position: 'relative', marginBottom: 6 },
  successIconOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: { fontWeight: '900', letterSpacing: -0.5, marginTop: 4 },
  successDescription: { textAlign: 'center', lineHeight: 22, fontSize: 14, paddingHorizontal: 16, marginBottom: 12 },
});
