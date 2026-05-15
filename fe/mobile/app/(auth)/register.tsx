/**
 * Register screen — UC01.1 (Provider only)
 */
import { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { authApi } from '../../features/auth/auth.api';

export default function RegisterScreen() {
  const theme = useTheme();
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    setError('');
  };

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.fullName.trim()) errors.fullName = 'Họ tên không được để trống';
    else if (form.fullName.length > 50) errors.fullName = 'Tối đa 50 ký tự';

    if (!form.email.trim()) errors.email = 'Email không được để trống';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email không hợp lệ';

    if (!form.phone.trim()) errors.phone = 'SĐT không được để trống';
    else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(form.phone)) errors.phone = 'SĐT không hợp lệ';

    if (!form.password) errors.password = 'Mật khẩu không được để trống';
    else if (form.password.length < 8) errors.password = 'Tối thiểu 8 ký tự';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      errors.password = 'Cần có chữ hoa, chữ thường và số';

    if (form.password !== form.confirmPassword) errors.confirmPassword = 'Mật khẩu không khớp';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      // Gửi OTP trước
      await authApi.resendOtp(form.email.trim());
      // Chuyển sang OTP screen kèm data
      router.push({
        pathname: '/(auth)/otp',
        params: {
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          password: form.password,
          mode: 'register',
        },
      });
    } catch (err: any) {
      const msg = err.response?.data?.error?.message;
      const code = err.response?.data?.error?.code;
      if (code === 'DUPLICATE_EMAIL') {
        setFieldErrors((prev) => ({ ...prev, email: 'Email đã được sử dụng' }));
      } else {
        setError(msg || 'Không thể gửi mã OTP. Vui lòng thử lại.');
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.logoBox, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.logoText}>H</Text>
          </View>
          <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
            Đăng ký tài khoản
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Tạo tài khoản Nhà cung cấp dịch vụ
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <TextInput
            label="Họ và tên *"
            value={form.fullName}
            onChangeText={(v) => updateField('fullName', v)}
            mode="outlined"
            autoComplete="name"
            left={<TextInput.Icon icon="account-outline" />}
            error={!!fieldErrors.fullName}
            style={styles.input}
          />
          {fieldErrors.fullName ? <HelperText type="error">{fieldErrors.fullName}</HelperText> : null}

          <TextInput
            label="Email *"
            value={form.email}
            onChangeText={(v) => updateField('email', v)}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            left={<TextInput.Icon icon="email-outline" />}
            error={!!fieldErrors.email}
            style={styles.input}
          />
          {fieldErrors.email ? <HelperText type="error">{fieldErrors.email}</HelperText> : null}

          <TextInput
            label="Số điện thoại *"
            value={form.phone}
            onChangeText={(v) => updateField('phone', v)}
            mode="outlined"
            keyboardType="phone-pad"
            autoComplete="tel"
            left={<TextInput.Icon icon="phone-outline" />}
            error={!!fieldErrors.phone}
            style={styles.input}
          />
          {fieldErrors.phone ? <HelperText type="error">{fieldErrors.phone}</HelperText> : null}

          <TextInput
            label="Mật khẩu *"
            value={form.password}
            onChangeText={(v) => updateField('password', v)}
            mode="outlined"
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock-outline" />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            error={!!fieldErrors.password}
            style={styles.input}
          />
          {fieldErrors.password ? <HelperText type="error">{fieldErrors.password}</HelperText> : null}

          <TextInput
            label="Xác nhận mật khẩu *"
            value={form.confirmPassword}
            onChangeText={(v) => updateField('confirmPassword', v)}
            mode="outlined"
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock-check-outline" />}
            error={!!fieldErrors.confirmPassword}
            style={styles.input}
          />
          {fieldErrors.confirmPassword ? (
            <HelperText type="error">{fieldErrors.confirmPassword}</HelperText>
          ) : null}

          {error ? <HelperText type="error" visible>{error}</HelperText> : null}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.registerBtn}
            contentStyle={{ height: 52 }}
            labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
          >
            Tiếp tục
          </Button>
        </View>

        {/* Login link */}
        <View style={styles.footer}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Đã có tài khoản?{' '}
          </Text>
          <Button mode="text" compact onPress={() => router.back()}>
            Đăng nhập
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 48 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 56, height: 56, borderRadius: 14, alignItems: 'center',
    justifyContent: 'center', marginBottom: 16,
  },
  logoText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  title: { fontWeight: 'bold', marginBottom: 4 },
  form: { gap: 2 },
  input: { marginBottom: 4 },
  registerBtn: { marginTop: 16, borderRadius: 12 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
});
