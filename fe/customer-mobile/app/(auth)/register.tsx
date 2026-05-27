import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput, useTheme } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomerCard, CustomerScreen, InlineMessage } from '../../components/customer/customer-ui';
import { Colors } from '../../constants/colors';
import { authApi } from '../../features/auth/auth.api';
import { routes } from '../../lib/route-utils';
import {
  FieldErrors,
  getApiErrorMessage,
  isValidEmail,
  isValidVietnamPhone,
  normalizeEmail,
  normalizePhone,
} from '../../features/auth/auth.validation';

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterField>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const updateField = (field: RegisterField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setFormError('');
  };

  const getPasswordStrength = (pass: string): PasswordStrength => {
    if (!pass) return 'empty';
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (/\d/.test(pass)) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score += 1;

    if (pass.length < 6 || score <= 1) return 'weak';
    if (score === 2 || score === 3) return 'medium';
    return 'strong';
  };

  const strength = getPasswordStrength(form.password);

  const getStrengthConfig = () => {
    switch (strength) {
      case 'weak':
        return { color: '#EF4444', label: 'Yếu (Nhập thêm số & chữ)', width: '33%' };
      case 'medium':
        return { color: '#F59E0B', label: 'Trung bình (Thêm chữ hoa/kí tự đặc biệt)', width: '66%' };
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
      } else if (field === 'email' && !isValidEmail(value)) {
        errors.email = 'Email không đúng định dạng';
      } else if (field === 'phone' && !isValidVietnamPhone(value)) {
        errors.phone = 'Số điện thoại Việt Nam không hợp lệ';
      } else if (field === 'password' && value.length < 6) {
        errors.password = 'Mật khẩu cần tối thiểu 6 ký tự';
      } else if (field === 'confirmPassword' && value !== form.password) {
        errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      }
      return errors;
    });
  };

  const validate = () => {
    const nextErrors: FieldErrors<RegisterField> = {};
    if (form.fullName.trim().length < 2) {
      nextErrors.fullName = 'Họ tên cần tối thiểu 2 ký tự';
    }
    if (!isValidEmail(form.email)) {
      nextErrors.email = 'Email không hợp lệ';
    }
    if (!isValidVietnamPhone(form.phone)) {
      nextErrors.phone = 'Số điện thoại Việt Nam không hợp lệ';
    }
    if (form.password.length < 6) {
      nextErrors.password = 'Mật khẩu cần tối thiểu 6 ký tự';
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
    setFormError('');
    const email = normalizeEmail(form.email);
    try {
      await authApi.register({
        fullName: form.fullName.trim(),
        email,
        phone: normalizePhone(form.phone),
        password: form.password,
        role: 'CUSTOMER',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.push(routes.auth.otp(email));
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Đăng ký không thành công. Email hoặc số điện thoại có thể đã tồn tại.'));
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

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
    >
      <CustomerScreen contentStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                router.back();
              }}
              style={[styles.backButton, { borderColor: Colors.light.border }]}
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color={Colors.light.text} />
            </Pressable>
            <View style={{ flex: 1 }} />
          </View>

          <Text variant="headlineMedium" style={styles.title}>
            Tạo tài khoản mới
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Trải nghiệm dịch vụ nhanh chóng, chuyên nghiệp và tiện ích ngay hôm nay
          </Text>
        </View>

        <CustomerCard contentStyle={styles.cardContent}>
          {formError ? <InlineMessage tone="error" message={formError} /> : null}

          <View style={styles.inputContainer}>
            <TextInput
              label="Họ và tên"
              mode="outlined"
              value={form.fullName}
              onChangeText={(value) => updateField('fullName', value)}
              onBlur={() => handleBlur('fullName')}
              autoCapitalize="words"
              textContentType="name"
              left={<TextInput.Icon icon="account-outline" color={Colors.light.primary} />}
              error={Boolean(fieldErrors.fullName)}
              disabled={loading}
              returnKeyType="next"
              outlineStyle={styles.inputOutline}
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
              left={<TextInput.Icon icon="email-outline" color={Colors.light.primary} />}
              error={Boolean(fieldErrors.email)}
              disabled={loading}
              returnKeyType="next"
              outlineStyle={styles.inputOutline}
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
              left={<TextInput.Icon icon="phone-outline" color={Colors.light.primary} />}
              error={Boolean(fieldErrors.phone)}
              disabled={loading}
              returnKeyType="next"
              outlineStyle={styles.inputOutline}
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
              left={<TextInput.Icon icon="lock-outline" color={Colors.light.primary} />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  color={Colors.light.textSecondary}
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
              left={<TextInput.Icon icon="lock-check-outline" color={Colors.light.primary} />}
              right={
                <TextInput.Icon
                  icon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  color={Colors.light.textSecondary}
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
          >
            Đăng ký tài khoản
          </Button>

          <Text variant="bodySmall" style={styles.disclaimer}>
            Bằng việc nhấn Đăng ký, bạn đồng ý với các Điều khoản Dịch vụ và Chính sách Bảo mật của chúng tôi.
          </Text>
        </CustomerCard>
      </CustomerScreen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1, backgroundColor: Colors.light.background },
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
    backgroundColor: '#FFFFFF',
  },
  title: { color: Colors.light.text, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: Colors.light.textSecondary, lineHeight: 22, fontSize: 14 },
  cardContent: { gap: 6 },
  inputContainer: { marginBottom: 2 },
  inputOutline: { borderRadius: 14 },
  helperText: { paddingLeft: 4 },
  strengthWrapper: { marginTop: 6, paddingHorizontal: 4, gap: 4 },
  strengthTrack: { height: 4, width: '100%', backgroundColor: '#E2E8F0', borderRadius: 2, overflow: 'hidden' },
  strengthBar: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700' },
  primaryButton: { borderRadius: 14, marginTop: 12, shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 6 },
  buttonContent: { height: 54 },
  buttonLabel: { fontSize: 16, fontWeight: '800' },
  disclaimer: { textAlign: 'center', color: Colors.light.textSecondary, marginTop: 12, paddingHorizontal: 12, fontSize: 11, lineHeight: 16 },
});
