import { useActiveColors } from '../../hooks/useActiveColors';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomerCard, CustomerScreen, InlineMessage } from '../../components/customer/customer-ui';
import { Colors } from '../../constants/colors';
import { authApi } from '../../features/auth/auth.api';
import { digitsOnly, getApiErrorMessage } from '../../features/auth/auth.validation';
import { routes } from '../../lib/route-utils';

type OtpForm = {
  otp: string;
};

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

export default function OtpScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const router = useRouter();
  const { email = '' } = useLocalSearchParams<{ email: string }>();
  const inputRef = useRef<any>(null);
  const [form, setForm] = useState<OtpForm>({ otp: '' });
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  const hasEmail = Boolean(email);

  useEffect(() => {
    const timeout = setTimeout(() => inputRef.current?.focus?.(), 250);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (form.otp.length === OTP_LENGTH && hasEmail && !loading) {
      verify(form.otp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.otp]);

  const updateOtp = (value: string) => {
    const cleaned = digitsOnly(value, OTP_LENGTH);
    setForm({ otp: cleaned });
    setFieldError('');
    setFormError('');
    setMessage('');
  };

  const validate = (otp = form.otp) => {
    if (!hasEmail) {
      setFormError('Thiếu thông tin xác thực email. Vui lòng thử lại.');
      return false;
    }
    if (otp.length !== OTP_LENGTH) {
      setFieldError(`Vui lòng nhập đầy đủ ${OTP_LENGTH} chữ số`);
      return false;
    }
    return true;
  };

  const verify = async (otp = form.otp) => {
    if (!validate(otp)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }
    setLoading(true);
    setFormError('');
    setMessage('');
    try {
      await authApi.verifyOtp({ email, otp });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace({
        pathname: routes.auth.login,
        params: { message: 'Đã xác thực email thành công! Vui lòng đăng nhập.' },
      });
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Mã xác thực OTP không chính xác hoặc đã hết hạn'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!hasEmail || countdown > 0 || resendLoading) return;
    setResendLoading(true);
    setFormError('');
    setMessage('');
    try {
      await authApi.resendOtp(email);
      setCountdown(RESEND_SECONDS);
      setMessage('Mã OTP mới đã được gửi thành công đến email của bạn.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setResendLoading(false);
    }
  };

  const handleBoxPress = () => {
    inputRef.current?.focus();
  };

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
              style={[styles.backButton, { borderColor: activeColors.border }]}
            >
              <MaterialCommunityIcons name="chevron-left" size={26} color={activeColors.text} />
            </Pressable>
            <View style={{ flex: 1 }} />
          </View>

          <Text variant="headlineMedium" style={styles.title}>
            Xác minh Email
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến địa chỉ email: {'\n'}
            <Text style={styles.emailHighlight}>{email || 'email của bạn'}</Text>
          </Text>
        </View>

        <CustomerCard contentStyle={styles.cardContent}>
          {!hasEmail ? (
            <InlineMessage
              tone="error"
              message="Không tìm thấy email cần xác thực. Vui lòng quay lại màn hình trước."
            />
          ) : null}
          {message ? <InlineMessage tone="success" message={message} /> : null}
          {formError ? <InlineMessage tone="error" message={formError} /> : null}

          {/* Segmented OTP Boxes */}
          <Pressable style={styles.otpGrid} onPress={handleBoxPress}>
            {Array.from({ length: OTP_LENGTH }).map((_, index) => {
              const digit = form.otp[index] || '';
              const isFocused = form.otp.length === index;
              return (
                <View
                  key={index}
                  style={[
                    styles.otpBox,
                    { borderColor: isFocused ? activeColors.primary : activeColors.border },
                    isFocused && styles.otpBoxFocused,
                    Boolean(fieldError) && styles.otpBoxError,
                  ]}
                >
                  <Text style={styles.otpDigit}>{digit}</Text>
                  {isFocused && <View style={[styles.cursor, { backgroundColor: activeColors.primary }]} />}
                </View>
              );
            })}
          </Pressable>

          {/* Hidden input overlay */}
          <TextInput
            ref={inputRef}
            value={form.otp}
            onChangeText={updateOtp}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            maxLength={OTP_LENGTH}
            style={styles.hiddenInput}
            caretHidden
            disabled={loading || !hasEmail}
          />

          {fieldError ? (
            <HelperText type="error" visible style={styles.helperText}>
              {fieldError}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={() => verify()}
            loading={loading}
            disabled={loading || !hasEmail || form.otp.length !== OTP_LENGTH}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Xác nhận mã OTP
          </Button>

          <View style={styles.resendContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={countdown > 0 ? activeColors.textSecondary : activeColors.primary}
            />
            <Button
              mode="text"
              compact
              onPress={resend}
              loading={resendLoading}
              disabled={!hasEmail || resendLoading || countdown > 0}
              labelStyle={[
                styles.resendLabel,
                { color: countdown > 0 ? activeColors.textSecondary : activeColors.primary },
              ]}
            >
              {countdown > 0 ? `Gửi lại mã sau ${countdown}s` : 'Gửi lại mã OTP'}
            </Button>
          </View>
        </CustomerCard>
      </CustomerScreen>
    </KeyboardAvoidingView>
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  keyboard: { flex: 1, backgroundColor: activeColors.background },
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
  title: { color: activeColors.text, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: activeColors.textSecondary, lineHeight: 22, fontSize: 14 },
  emailHighlight: { color: activeColors.text, fontWeight: '800' },
  cardContent: { gap: 12, paddingVertical: 12 },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginVertical: 12,
    paddingHorizontal: 4,
  },
  otpBox: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  otpBoxFocused: {
    backgroundColor: '#FFFFFF',
    shadowColor: activeColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  otpBoxError: {
    borderColor: '#EF4444',
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '800',
    color: activeColors.text,
  },
  cursor: {
    position: 'absolute',
    width: 2,
    height: 20,
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  helperText: { textAlign: 'center', fontWeight: '600' },
  primaryButton: { borderRadius: 14, marginTop: 8, shadowColor: activeColors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.16, shadowRadius: 6 },
  buttonContent: { height: 54 },
  buttonLabel: { fontSize: 16, fontWeight: '800' },
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginTop: 6,
  },
  resendLabel: { fontWeight: '800', fontSize: 14 },
});
