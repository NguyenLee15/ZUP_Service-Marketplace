import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
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
  normalizeEmail,
} from '../../features/auth/auth.validation';

type ForgotPasswordForm = {
  email: string;
};

type ForgotPasswordField = keyof ForgotPasswordForm;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [form, setForm] = useState<ForgotPasswordForm>({ email: '' });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<ForgotPasswordField>>({});
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateEmail = (email: string) => {
    setForm({ email });
    setFieldErrors({});
    setFormError('');
    setMessage('');
  };

  const handleBlur = () => {
    if (form.email && !isValidEmail(form.email)) {
      setFieldErrors({ email: 'Email không đúng định dạng' });
    }
  };

  const validate = () => {
    if (!isValidEmail(form.email)) {
      setFieldErrors({ email: 'Email không hợp lệ' });
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const submit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    setLoading(true);
    setFormError('');
    setMessage('');
    try {
      await authApi.forgotPassword({ email: normalizeEmail(form.email) });
      setMessage(form.email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra lại.'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMailClient = () => {
    Haptics.selectionAsync().catch(() => {});
    Linking.openURL('mailto:').catch(() => {
      // Fallback if mail client is not found
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'android' ? 24 : 0}
    >
      <CustomerScreen contentStyle={styles.content}>
        {/* Render Form Header ONLY when not in Success State */}
        {!message ? (
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
              Quên mật khẩu
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Đừng lo lắng! Nhập email tài khoản khách hàng để nhận liên kết khôi phục mật khẩu.
            </Text>
          </View>
        ) : null}

        {/* Dynamic Success View or Input View */}
        {message ? (
          <CustomerCard style={styles.successCard} contentStyle={styles.successCardContent}>
            <View style={styles.successIconWrapper}>
              <View style={[styles.successIconOuter, { backgroundColor: `${Colors.light.success}16` }]}>
                <MaterialCommunityIcons name="email-outline" size={54} color={Colors.light.success} />
              </View>
              <View style={styles.successBadge}>
                <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
              </View>
            </View>

            <Text variant="headlineSmall" style={styles.successTitle}>
              Đã gửi liên kết!
            </Text>

            <Text variant="bodyMedium" style={styles.successDescription}>
              Chúng tôi đã gửi thư hướng dẫn thiết lập mật khẩu mới đến địa chỉ email: {'\n'}
              <Text style={styles.emailHighlight}>{message}</Text>
            </Text>

            <Text variant="bodySmall" style={styles.spamNotice}>
              *Vui lòng kiểm tra kỹ cả trong hộp thư rác (Spam) hoặc quảng cáo nếu không tìm thấy ở hộp thư đến chính.
            </Text>

            <View style={styles.successActions}>
              <Button
                mode="contained"
                onPress={handleOpenMailClient}
                style={styles.primaryButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Mở ứng dụng Email
              </Button>

              <Button
                mode="outlined"
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  router.replace(routes.auth.login);
                }}
                style={styles.secondaryButton}
                contentStyle={styles.buttonContent}
                labelStyle={styles.secondaryButtonLabel}
              >
                Quay lại Đăng nhập
              </Button>
            </View>
          </CustomerCard>
        ) : (
          <CustomerCard contentStyle={styles.cardContent}>
            {formError ? <InlineMessage tone="error" message={formError} /> : null}

            <View style={styles.inputContainer}>
              <TextInput
                label="Địa chỉ Email của bạn"
                mode="outlined"
                value={form.email}
                onChangeText={updateEmail}
                onBlur={handleBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
                left={<TextInput.Icon icon="email-outline" color={Colors.light.primary} />}
                error={Boolean(fieldErrors.email)}
                disabled={loading}
                returnKeyType="done"
                onSubmitEditing={submit}
                outlineStyle={styles.inputOutline}
              />
              {fieldErrors.email ? (
                <HelperText type="error" visible style={styles.helperText}>
                  {fieldErrors.email}
                </HelperText>
              ) : null}
            </View>

            <Button
              mode="contained"
              onPress={submit}
              loading={loading}
              disabled={loading || !form.email.trim()}
              style={styles.primaryButton}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
            >
              Gửi liên kết khôi phục
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
          </CustomerCard>
        )}
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
  cardContent: { gap: 8, paddingVertical: 8 },
  inputContainer: { marginBottom: 2 },
  inputOutline: { borderRadius: 14 },
  helperText: { paddingLeft: 4 },
  primaryButton: { borderRadius: 14, marginTop: 8, shadowColor: Colors.light.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 6 },
  secondaryButton: { borderRadius: 14, borderWidth: 1.5, borderColor: Colors.light.border },
  buttonContent: { height: 54 },
  buttonLabel: { fontSize: 16, fontWeight: '800' },
  secondaryButtonLabel: { fontSize: 16, fontWeight: '800', color: Colors.light.text },
  textButton: { marginTop: 4 },

  // Success view styling
  successCard: { borderRadius: 24, paddingVertical: 12 },
  successCardContent: { alignItems: 'center', gap: 16, paddingHorizontal: 12 },
  successIconWrapper: { position: 'relative', marginBottom: 6 },
  successIconOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#10B981',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  successTitle: { color: Colors.light.text, fontWeight: '900', letterSpacing: -0.5, marginTop: 4 },
  successDescription: { textAlign: 'center', color: Colors.light.textSecondary, lineHeight: 22, fontSize: 14, paddingHorizontal: 4 },
  emailHighlight: { color: Colors.light.text, fontWeight: '800', fontSize: 15 },
  spamNotice: { textAlign: 'center', color: Colors.light.textSecondary, fontStyle: 'italic', fontSize: 11, lineHeight: 16, paddingHorizontal: 8 },
  successActions: { width: '100%', gap: 10, marginTop: 10 },
});
