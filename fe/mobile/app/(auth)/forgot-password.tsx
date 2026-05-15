/**
 * Forgot Password screen — UC02.3
 * Nhập email → gửi OTP → chuyển sang OTP screen
 */
import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { authApi } from '../../features/auth/auth.api';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await authApi.resendOtp(email.trim());
      router.push({
        pathname: '/(auth)/otp',
        params: { email: email.trim(), mode: 'forgot' },
      });
    } catch (err: any) {
      const code = err.response?.data?.error?.code;
      if (code === 'OTP_RATE_LIMIT') {
        setError('Gửi quá nhiều lần. Vui lòng chờ.');
      } else {
        // Không tiết lộ email tồn tại hay không (BR1)
        setError('Nếu email tồn tại, mã OTP sẽ được gửi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          Quên mật khẩu
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 32 }}
        >
          Nhập email đã đăng ký để nhận mã xác thực
        </Text>

        <TextInput
          label="Email"
          value={email}
          onChangeText={(v) => { setEmail(v); setError(''); }}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          left={<TextInput.Icon icon="email-outline" />}
          error={!!error}
          style={styles.input}
        />

        {error ? <HelperText type="error">{error}</HelperText> : null}

        <Button
          mode="contained"
          onPress={handleSendOtp}
          loading={loading}
          disabled={loading || !email.trim()}
          style={styles.sendBtn}
          contentStyle={{ height: 52 }}
          labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
        >
          Gửi mã xác thực
        </Button>

        <Button mode="text" onPress={() => router.back()} style={{ marginTop: 16 }} icon="arrow-left">
          Quay lại đăng nhập
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 24 },
  title: { fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  input: { marginBottom: 4 },
  sendBtn: { marginTop: 16, borderRadius: 12 },
});
