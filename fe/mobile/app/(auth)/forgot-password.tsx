import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProviderAuthScreen, ProviderAuthCard, ProviderInlineMessage } from '../../components/provider/ProviderAuthLayout';
import { Colors } from '../../constants/colors';
import { authApi } from '../../features/auth/auth.api';
import { routes } from '../../lib/route-utils';

type ApiErrorLike = {
  response?: {
    data?: {
      error?: {
        code?: string;
      };
    };
  };
};

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không đúng định dạng');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.resendOtp(email.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.push({
        pathname: '/(auth)/otp',
        params: { email: email.trim(), mode: 'forgot' },
      });
    } catch (err: unknown) {
      const code = (err as ApiErrorLike).response?.data?.error?.code;
      if (code === 'OTP_RATE_LIMIT') {
        setError('Gửi quá nhiều lần. Vui lòng chờ.');
      } else {
        // Không tiết lộ email tồn tại hay không (BR1)
        setError('Nếu email tồn tại, mã OTP sẽ được gửi.');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

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
            Quên mật khẩu
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Đừng lo lắng! Nhập email tài khoản đối tác để nhận mã xác thực OTP khôi phục mật khẩu.
          </Text>
        </View>

        <ProviderAuthCard contentStyle={styles.cardContent}>
          {error ? <ProviderInlineMessage tone="error" message={error} /> : null}

          <View style={styles.inputContainer}>
            <TextInput
              label="Địa chỉ Email của bạn"
              mode="outlined"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setError('');
              }}
              onBlur={() => {
                if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                  setError('Email không đúng định dạng');
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              left={<TextInput.Icon icon="email-outline" color={theme.colors.primary} />}
              error={Boolean(error)}
              disabled={loading}
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
              outlineStyle={styles.inputOutline}
              outlineColor={theme.colors.outlineVariant}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              style={{ backgroundColor: theme.colors.surface }}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleSendOtp}
            loading={loading}
            disabled={loading || !email.trim()}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor={theme.colors.primary}
          >
            Gửi mã xác thực OTP
          </Button>

          <Button
            mode="text"
            disabled={loading}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              router.replace(routes.auth.login);
            }}
            style={styles.textButton}
            labelStyle={{ fontWeight: '700' }}
          >
            Quay lại đăng nhập
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
  textButton: { marginTop: 4 },
});
