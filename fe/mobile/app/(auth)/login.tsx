/**
 * Login screen — UC02.1
 */
import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { authApi } from '../../features/auth/auth.api';
import { useAuthStore } from '../../features/auth/auth.store';

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authApi.login({ email: email.trim(), password });
      const { accessToken, refreshToken, user } = res.data.data;

      // Chỉ cho phép Provider đăng nhập
      if (user.role !== 'PROVIDER') {
        setError('Ứng dụng này chỉ dành cho Nhà cung cấp dịch vụ');
        return;
      }

      await setTokens(accessToken, refreshToken);
      setUser(user);
    } catch (err: any) {
      if (!err.response) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.');
        return;
      }
      const msg = err.response?.data?.error?.message;
      setError(msg || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={[styles.logoBox, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.logoText}>H</Text>
          </View>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
            HomeService
          </Text>
          <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            Đăng nhập tài khoản Nhà cung cấp
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined"
            keyboardType="email-address" autoCapitalize="none" autoComplete="email"
            left={<TextInput.Icon icon="email-outline" />} style={styles.input} />

          <TextInput label="Mật khẩu" value={password} onChangeText={setPassword} mode="outlined"
            secureTextEntry={!showPassword} autoComplete="password"
            left={<TextInput.Icon icon="lock-outline" />}
            right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} />}
            style={styles.input} />

          {error ? <HelperText type="error" visible>{error}</HelperText> : null}

          <Button mode="contained" onPress={handleLogin} loading={loading}
            disabled={loading || !email.trim() || !password.trim()}
            style={styles.loginBtn} contentStyle={{ height: 52 }} labelStyle={{ fontSize: 16, fontWeight: 'bold' }}>
            Đăng nhập
          </Button>

          <Button mode="text" onPress={() => router.push('/(auth)/forgot-password' as any)} style={{ marginTop: 8, alignSelf: 'center' }}>
            Quên mật khẩu?
          </Button>
        </View>

        <View style={styles.footer}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>Chưa có tài khoản? </Text>
          <Button mode="text" compact onPress={() => router.push('/(auth)/register' as any)}>Đăng ký ngay</Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  header: { alignItems: 'center', marginBottom: 40 },
  logoBox: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  title: { fontWeight: 'bold', marginBottom: 8 },
  form: { gap: 4 },
  input: { marginBottom: 8 },
  loginBtn: { marginTop: 16, borderRadius: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32 },
});
