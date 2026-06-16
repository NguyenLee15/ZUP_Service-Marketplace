import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProviderAuthScreen, ProviderAuthCard, ProviderInlineMessage } from '../../components/provider/ProviderAuthLayout';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { authApi } from '../../features/auth/auth.api';
import { routes } from '../../lib/route-utils';

type ApiErrorLike = {
  response?: {
    data?: {
      error?: {
        message?: string;
        code?: string;
      };
      message?: string;
    };
  };
};

type RegisterForm = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

type RegisterField = keyof RegisterForm;

type PasswordStrength = 'weak' | 'medium' | 'strong' | 'empty';

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [form, setForm] = useState<RegisterForm>({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterField, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: RegisterField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setError('');
  };

  const getPasswordStrength = (pass: string): PasswordStrength => {
    if (!pass) return 'empty';
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;

    if (pass.length < 8 || score <= 1) return 'weak';
    if (score === 2 || score === 3) return 'medium';
    return 'strong';
  };

  const strength = getPasswordStrength(form.password);

  const getStrengthConfig = () => {
    switch (strength) {
      case 'weak':
        return { color: '#EF4444', label: 'Yếu (Nhập thêm số & chữ)', width: '33%' };
      case 'medium':
        return { color: '#F59E0B', label: 'Trung bình (Thêm chữ hoa/số)', width: '66%' };
      case 'strong':
        return { color: '#10B981', label: 'Mật khẩu mạnh & an toàn', width: '100%' };
      default:
        return { color: '#E2E8F0', label: '', width: '0%' };
    }
  };

  const handleBlur = (field: RegisterField) => {
    const value = form[field];
    if (!value) return;

    setFieldErrors((current) => {
      const errors = { ...current };
      if (field === 'fullName' && value.trim().length < 2) {
        errors.fullName = 'Họ tên cần tối thiểu 2 ký tự';
      } else if (field === 'fullName' && value.length > 50) {
        errors.fullName = 'Tối đa 50 ký tự';
      } else if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.email = 'Email không đúng định dạng';
      } else if (field === 'phone' && !/^(0[3|5|7|8|9])+([0-9]{8})$/.test(value)) {
        errors.phone = 'Số điện thoại Việt Nam không hợp lệ';
      } else if (field === 'password') {
        if (value.length < 8) {
          errors.password = 'Mật khẩu cần tối thiểu 8 ký tự';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          errors.password = 'Cần có chữ hoa, chữ thường và số';
        }
      } else if (field === 'confirmPassword' && value !== form.password) {
        errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
      return errors;
    });
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<RegisterField, string>> = {};
    if (form.fullName.trim().length < 2) {
      nextErrors.fullName = 'Họ tên cần tối thiểu 2 ký tự';
    } else if (form.fullName.length > 50) {
      nextErrors.fullName = 'Tối đa 50 ký tự';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email không được để trống';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Email không hợp lệ';
    }

    if (!form.phone.trim()) {
      nextErrors.phone = 'Số điện thoại không được để trống';
    } else if (!/^(0[3|5|7|8|9])+([0-9]{8})$/.test(form.phone)) {
      nextErrors.phone = 'Số điện thoại không hợp lệ';
    }

    if (form.password.length < 8) {
      nextErrors.password = 'Mật khẩu cần tối thiểu 8 ký tự';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      nextErrors.password = 'Cần có chữ hoa, chữ thường và số';
    }

    if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = 'Mật khẩu nhập lại không khớp';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    setLoading(true);
    setError('');

    const emailNormalized = form.email.trim();
    try {
      // Gửi OTP trước
      await authApi.resendOtp(emailNormalized);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      // Chuyển sang OTP screen kèm data
      router.push({
        pathname: '/(auth)/otp',
        params: {
          email: emailNormalized,
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          password: form.password,
          mode: 'register',
        },
      });
    } catch (err: unknown) {
      const candidate = err as ApiErrorLike;
      const msg = candidate.response?.data?.error?.message;
      const code = candidate.response?.data?.error?.code;
      if (code === 'DUPLICATE_EMAIL') {
        setFieldErrors((prev) => ({ ...prev, email: 'Email đã được sử dụng' }));
      } else {
        setError(msg || 'Không thể gửi mã OTP. Vui lòng thử lại.');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const submitDisabled =
    loading ||
    !form.fullName.trim() ||
    !form.email.trim() ||
    !form.phone.trim() ||
    !form.password ||
    !form.confirmPassword;

  const strengthConfig = getStrengthConfig();
  const activeColors = theme.dark ? Colors.dark : Colors.light;

  return (
    <KeyboardAvoidingView
      style={[styles.keyboard, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
            Đăng ký tài khoản
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
            Tạo tài khoản Nhà cung cấp dịch vụ để nhận việc và tăng thu nhập ngay hôm nay
          </Text>
        </View>

        <ProviderAuthCard contentStyle={styles.cardContent}>
          {error ? <ProviderInlineMessage tone="error" message={error} /> : null}

          <View style={styles.inputContainer}>
            <TextInput
              label="Họ và tên"
              mode="outlined"
              value={form.fullName}
              onChangeText={(value) => updateField('fullName', value)}
              onBlur={() => handleBlur('fullName')}
              autoCapitalize="words"
              textContentType="name"
              left={<TextInput.Icon icon="account-outline" color={theme.colors.primary} />}
              error={Boolean(fieldErrors.fullName)}
              disabled={loading}
              returnKeyType="next"
              outlineStyle={styles.inputOutline}
              outlineColor={theme.colors.outlineVariant}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              style={{ backgroundColor: theme.colors.surface }}
            />
            {fieldErrors.fullName ? (
              <HelperText type="error" visible style={styles.helperText}>
                {fieldErrors.fullName}
              </HelperText>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              label="Địa chỉ Email"
              mode="outlined"
              value={form.email}
              onChangeText={(value) => updateField('email', value)}
              onBlur={() => handleBlur('email')}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              left={<TextInput.Icon icon="email-outline" color={theme.colors.primary} />}
              error={Boolean(fieldErrors.email)}
              disabled={loading}
              returnKeyType="next"
              outlineStyle={styles.inputOutline}
              outlineColor={theme.colors.outlineVariant}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              style={{ backgroundColor: theme.colors.surface }}
            />
            {fieldErrors.email ? (
              <HelperText type="error" visible style={styles.helperText}>
                {fieldErrors.email}
              </HelperText>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              label="Số điện thoại"
              mode="outlined"
              value={form.phone}
              onChangeText={(value) => updateField('phone', value)}
              onBlur={() => handleBlur('phone')}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              left={<TextInput.Icon icon="phone-outline" color={theme.colors.primary} />}
              error={Boolean(fieldErrors.phone)}
              disabled={loading}
              returnKeyType="next"
              outlineStyle={styles.inputOutline}
              outlineColor={theme.colors.outlineVariant}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              style={{ backgroundColor: theme.colors.surface }}
            />
            {fieldErrors.phone ? (
              <HelperText type="error" visible style={styles.helperText}>
                {fieldErrors.phone}
              </HelperText>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              label="Mật khẩu bảo mật"
              mode="outlined"
              value={form.password}
              onChangeText={(value) => updateField('password', value)}
              onBlur={() => handleBlur('password')}
              secureTextEntry={!showPassword}
              textContentType="newPassword"
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
              error={Boolean(fieldErrors.password)}
              disabled={loading}
              returnKeyType="next"
              outlineStyle={styles.inputOutline}
              outlineColor={theme.colors.outlineVariant}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              style={{ backgroundColor: theme.colors.surface }}
            />
            {strength !== 'empty' ? (
              <View style={styles.strengthWrapper}>
                <View style={styles.strengthTrack}>
                  <View
                    style={[
                      styles.strengthBar,
                      { backgroundColor: strengthConfig.color, width: strengthConfig.width as any },
                    ]}
                  />
                </View>
                <Text style={[styles.strengthLabel, { color: strengthConfig.color }]}>
                  {strengthConfig.label}
                </Text>
              </View>
            ) : null}
            {fieldErrors.password ? (
              <HelperText type="error" visible style={styles.helperText}>
                {fieldErrors.password}
              </HelperText>
            ) : null}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              label="Nhập lại mật khẩu"
              mode="outlined"
              value={form.confirmPassword}
              onChangeText={(value) => updateField('confirmPassword', value)}
              onBlur={() => handleBlur('confirmPassword')}
              secureTextEntry={!showConfirmPassword}
              textContentType="newPassword"
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
              error={Boolean(fieldErrors.confirmPassword)}
              disabled={loading}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              outlineStyle={styles.inputOutline}
              outlineColor={theme.colors.outlineVariant}
              activeOutlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
              style={{ backgroundColor: theme.colors.surface }}
            />
            {fieldErrors.confirmPassword ? (
              <HelperText type="error" visible style={styles.helperText}>
                {fieldErrors.confirmPassword}
              </HelperText>
            ) : null}
          </View>

          <Button
            mode="contained"
            loading={loading}
            disabled={submitDisabled}
            onPress={handleRegister}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
            buttonColor={theme.colors.primary}
          >
            Tiếp tục
          </Button>

          <Text variant="bodySmall" style={[styles.disclaimer, { color: theme.colors.onSurfaceVariant }]}>
            Bằng việc nhấn Tiếp tục, bạn đồng ý với các Điều khoản Dịch vụ và Chính sách Bảo mật của chúng tôi dành cho Đối tác.
          </Text>
        </ProviderAuthCard>

        {/* Login link */}
        <View style={styles.footer}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Đã có tài khoản?{' '}
          </Text>
          <Pressable onPress={() => router.push(routes.auth.login)}>
            <Text style={[styles.registerLink, { color: theme.colors.primary }]}>
              Đăng nhập
            </Text>
          </Pressable>
        </View>
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
  cardContent: { gap: 6 },
  inputContainer: { marginBottom: 2 },
  inputOutline: { borderRadius: 14 },
  helperText: { paddingLeft: 4 },
  strengthWrapper: { marginTop: 6, paddingHorizontal: 4, gap: 4 },
  strengthTrack: { height: 4, width: '100%', backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' },
  strengthBar: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700' },
  primaryButton: { borderRadius: 14, marginTop: 12 },
  buttonContent: { height: 54 },
  buttonLabel: { fontSize: 16, fontWeight: '800' },
  disclaimer: { textAlign: 'center', marginTop: 12, paddingHorizontal: 12, fontSize: 11, lineHeight: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, marginBottom: 20 },
  registerLink: { fontSize: 14, fontWeight: '700' },
});
