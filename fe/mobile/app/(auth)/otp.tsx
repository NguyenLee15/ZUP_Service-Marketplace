/**
 * OTP verification screen
 * Dùng cho cả register và forgot-password
 */
import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TextInput as RNTextInput, Pressable } from 'react-native';
import { Text, Button, useTheme, HelperText } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { authApi } from '../../features/auth/auth.api';
import { useAuthStore } from '../../features/auth/auth.store';
import { routes } from '../../lib/route-utils';

const OTP_LENGTH = 6;
const COOLDOWN_SECONDS = 60;

export default function OtpScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    email: string;
    fullName?: string;
    phone?: string;
    password?: string;
    mode: 'register' | 'forgot';
  }>();
  const { setTokens, setUser } = useAuthStore();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const inputRefs = useRef<(RNTextInput | null)[]>([]);

  // Đếm ngược resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleChange = (value: string, index: number) => {
    setError('');
    // Xử lý paste toàn bộ OTP
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (index + i < OTP_LENGTH) newOtp[index + i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value.replace(/\D/g, '');
    setOtp(newOtp);

    // Auto-focus ô tiếp theo
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Vui lòng nhập đầy đủ mã OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (params.mode === 'register') {
        // Tài khoản đã được tạo ở bước Register (với status PENDING).
        // Ở đây chỉ cần Verify OTP để kích hoạt tài khoản (chuyển sang ACTIVE).
        await authApi.verifyOtp({ email: params.email, otp: code });

        // Auto login sau khi verify thành công
        const loginRes = await authApi.login({ email: params.email, password: params.password! });
        const { accessToken, refreshToken, user } = loginRes.data.data;
        await setTokens(accessToken, refreshToken);
        setUser(user);
        // Root layout sẽ redirect về (tabs)
      } else {
        // Forgot password flow — verify OTP rồi chuyển reset password
        await authApi.verifyOtp({ email: params.email, otp: code });
        router.replace({
          pathname: routes.auth.resetPassword,
          params: { email: params.email, otp: code },
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message;
      const errCode = err.response?.data?.error?.code;
      if (errCode === 'OTP_INVALID') setError('Mã OTP không đúng hoặc đã hết hạn');
      else if (errCode === 'DUPLICATE_EMAIL') setError('Email đã được sử dụng');
      else setError(msg || 'Xác thực thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await authApi.resendOtp(params.email);
      setCooldown(COOLDOWN_SECONDS);
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const code = err.response?.data?.error?.code;
      if (code === 'OTP_RATE_LIMIT') setError('Gửi quá nhiều lần. Vui lòng chờ.');
      else setError('Không thể gửi lại mã OTP');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
          Xác thực OTP
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginBottom: 32 }}>
          Mã xác thực 6 số đã được gửi đến{'\n'}
          <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>{params.email}</Text>
        </Text>

        {/* OTP Input */}
        <View style={styles.otpRow}>
          {otp.map((digit, i) => (
            <Pressable key={i} onPress={() => inputRefs.current[i]?.focus()}>
              <RNTextInput
                ref={(ref) => { inputRefs.current[i] = ref; }}
                value={digit}
                onChangeText={(v) => handleChange(v, i)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={i === 0 ? OTP_LENGTH : 1}
                style={[
                  styles.otpInput,
                  {
                    borderColor: digit ? theme.colors.primary : theme.colors.outlineVariant,
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.onBackground,
                  },
                ]}
                selectTextOnFocus
              />
            </Pressable>
          ))}
        </View>

        {error ? <HelperText type="error" style={{ textAlign: 'center' }}>{error}</HelperText> : null}

        <Button
          mode="contained"
          onPress={handleVerify}
          loading={loading}
          disabled={loading || otp.join('').length < OTP_LENGTH}
          style={styles.verifyBtn}
          contentStyle={{ height: 52 }}
          labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
        >
          Xác nhận
        </Button>

        {/* Resend */}
        <View style={styles.resendRow}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Không nhận được mã?{' '}
          </Text>
          {cooldown > 0 ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Gửi lại sau {cooldown}s
            </Text>
          ) : (
            <Button mode="text" compact onPress={handleResend}>
              Gửi lại
            </Button>
          )}
        </View>

        <Button mode="text" onPress={() => router.back()} style={{ marginTop: 16 }} icon="arrow-left">
          Quay lại
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 24, alignItems: 'center' },
  title: { fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  otpRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  otpInput: {
    width: 48, height: 56, borderWidth: 2, borderRadius: 12,
    textAlign: 'center', fontSize: 22, fontWeight: 'bold',
  },
  verifyBtn: { marginTop: 16, borderRadius: 12, width: '100%' },
  resendRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
});
