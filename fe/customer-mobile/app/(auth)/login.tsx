/**
 * Login screen — Zup Customer (E-commerce Style)
 */
import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Pressable } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText, IconButton } from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authApi } from '../../features/auth/auth.api';
import { useAuthStore } from '../../features/auth/auth.store';
import type { CustomerUser } from '../../features/auth/auth.store';
import { routes } from '../../lib/route-utils';
import { isValidEmail, normalizeEmail } from '../../features/auth/auth.validation';
import { CustomerDialog } from '../../components/customer/customer-ui';
import { t } from '../../lib/i18n';
import { storage } from '../../lib/storage';

WebBrowser.maybeCompleteAuthSession();

const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '422532889022-1l2maodtv5p9kijh17499ip9g6sbbnlp.apps.googleusercontent.com';

const googleProviderConfigured = Boolean(googleWebClientId);

GoogleSignin.configure({
  webClientId: googleWebClientId,
  iosClientId: googleIosClientId,
  scopes: ['email', 'profile'],
});

type AuthPayload = {
  accessToken?: string;
  refreshToken?: string;
  user?: CustomerUser;
};

type LoginErrorLike = {
  response?: {
    data?: {
      error?: {
        message?: string;
      };
      message?: string;
    };
  };
};

function getLoginErrorMessage(error: unknown, fallback: string) {
  const candidate = error as LoginErrorLike;
  const message =
    candidate.response?.data?.error?.message ||
    candidate.response?.data?.message;

  if (!message) return fallback;
  if (/refreshToken|credential|client id|invalid_request|jwt|token/i.test(message)) {
    return fallback;
  }

  return message;
}

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ message?: string }>();
  const { setTokens, setUser, fetchProfile } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    description: '',
  });

  const isSubmittingRef = useRef(false);

  // Success message from search params (e.g. from password reset)
  const successMessage = params.message || '';

  const showDialog = (title: string, description: string, confirmLabel?: string, onConfirm?: () => void) => {
    setDialogConfig({
      visible: true,
      title,
      description,
      confirmLabel,
      onConfirm: onConfirm
        ? () => {
            onConfirm();
            setDialogConfig((prev) => ({ ...prev, visible: false }));
          }
        : undefined,
    });
  };



  const completeLogin = async (payload: AuthPayload) => {
    const user = payload?.user;

    if (!payload?.accessToken || !payload?.refreshToken || !user) {
      throw new Error('Invalid login response');
    }

    if (user.role !== 'CUSTOMER') {
      setError(t('auth.provider_error'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return false;
    }

    await setTokens(payload.accessToken, payload.refreshToken);
    setUser(user);
    await fetchProfile().catch(() => {});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.replace(routes.tabs.home);

    return true;
  };



  const handleLogin = async () => {
    if (isSubmittingRef.current) return;
    
    // Validation checks
    if (!email.trim() || !password.trim()) {
      setError(t('auth.validation_error'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    if (!isValidEmail(email)) {
      setError(t('auth.email_invalid'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError('');

    try {
      const res = await authApi.login({
        email: normalizeEmail(email),
        password
      });
      const payload = res.data?.data;
      await completeLogin(payload || {});
    } catch (err: unknown) {
      if (!(err as LoginErrorLike).response) {
        setError(t('auth.network_error'));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }
      setError(getLoginErrorMessage(err, 'Email hoặc mật khẩu không chính xác'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleGoogleCredential = async (credential: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setError('');

    try {
      const res = await authApi.googleLogin({ credential });
      const completed = await completeLogin(res.data?.data || {});
      if (!completed) setError(t('auth.google_error'));
    } catch (err: unknown) {
      if (!(err as LoginErrorLike).response) {
        setError(t('auth.network_error'));
      } else {
        setError(getLoginErrorMessage(err, t('auth.google_error')));
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Custom Premium Header */}
      <View style={[styles.headerBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
        <IconButton
          icon="arrow-left"
          size={24}
          iconColor={theme.colors.onSurface}
          onPress={() => router.back()}
          style={styles.backBtn}
        />
        <Text variant="titleMedium" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>{t('auth.login')}</Text>
        <IconButton
          icon="help-circle-outline"
          size={24}
          iconColor={theme.colors.primary}
          onPress={() => showDialog(t('general.support'), t('general.support_message'))}
          style={styles.helpBtn}
        />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.colors.background }]} keyboardShouldPersistTaps="handled">
        {/* Styled Logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/icon.png')}
            style={[styles.logoImage, { backgroundColor: theme.colors.surfaceVariant }]}
            resizeMode="cover"
          />
        </View>

          <View style={styles.form}>
          {successMessage ? (
            <Text style={styles.successMessageText}>{successMessage}</Text>
          ) : null}

          <TextInput
            label={t('auth.email_placeholder')}
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            left={<TextInput.Icon icon="account-outline" color={theme.colors.onSurfaceVariant} />}
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outlineVariant}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />

          <TextInput
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            autoComplete="password"
            left={<TextInput.Icon icon="lock-outline" color={theme.colors.onSurfaceVariant} />}
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                color={theme.colors.onSurfaceVariant}
                onPress={() => setShowPassword(!showPassword)}
                forceTextInputFocus={false}
              />
            }
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            outlineColor={theme.colors.outlineVariant}
            activeOutlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />
          <Pressable
            onPress={() => router.push(routes.auth.forgotPassword)}
            style={styles.forgotWrap}
            hitSlop={8}
          >
            <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
              Quên mật khẩu?
            </Text>
          </Pressable>

          {error ? <HelperText type="error" visible style={styles.helperText}>{error}</HelperText> : null}

          {/* Shopee-style Login Button */}
          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading || !email.trim() || !password.trim()}
            style={styles.loginBtn}
            contentStyle={styles.loginBtnContent}
            labelStyle={styles.loginBtnLabel}
            buttonColor={theme.colors.primary}
          >
            {t('auth.login')}
          </Button>

          {googleProviderConfigured ? (
            <>
              {/* OR Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
                <Text style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>HOẶC</Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
              </View>

              <GoogleLoginButton
                disabled={loading}
                onCredential={handleGoogleCredential}
                onError={(err) => setError(err)}
              />
            </>
          ) : null}
        </View>

        {/* Footer Account Registration */}
        <View style={styles.footer}>
          <Text variant="bodyMedium" style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>{t('auth.no_account')}</Text>
          <Pressable onPress={() => router.push(routes.auth.register)}>
            <Text style={[styles.registerLink, { color: theme.colors.primary }]}>{t('auth.register')}</Text>
          </Pressable>
        </View>


      </ScrollView>

      {/* Reusable Customer Dialog */}
      <CustomerDialog
        visible={dialogConfig.visible}
        title={dialogConfig.title}
        description={dialogConfig.description}
        confirmLabel={dialogConfig.confirmLabel}
        onConfirm={dialogConfig.onConfirm}
        onDismiss={() => setDialogConfig((prev) => ({ ...prev, visible: false }))}
      />
    </KeyboardAvoidingView>
  );
}

function GoogleLoginButton({
  disabled,
  onCredential,
  onError,
}: {
  disabled: boolean;
  onCredential: (credential: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const theme = useTheme();

  return (
    <Button
      mode="outlined"
      icon="google"
      onPress={async () => {
        try {
          await GoogleSignin.hasPlayServices();
          const response = await GoogleSignin.signIn();
          if (response?.data?.idToken) {
            void onCredential(response.data.idToken);
          } else {
            onError(t("auth.google_failed"));
          }
        } catch (error: any) {
          console.error('Google Signin Error:', error);
          onError(t("auth.google_failed"));
        }
      }}
      disabled={disabled}
      style={[styles.socialBtn, { borderColor: theme.colors.outlineVariant }]}
      contentStyle={styles.socialBtnContent}
      labelStyle={[styles.socialLabel, { color: theme.colors.onSurface }]}
    >
      {t("auth.google_login")}
    </Button>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 42 : 16,
    height: Platform.OS === 'ios' ? 84 : 62,
    borderBottomWidth: 1,
  },
  backBtn: { margin: 0 },
  helpBtn: { margin: 0 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 40,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 22,
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 14,
  },
  form: {
    gap: 12,
  },
  input: {
    minHeight: 56,
  },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -6, minHeight: 32, justifyContent: 'center' },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
  },
  helperText: {
    margin: 0,
    padding: 0,
  },
  loginBtn: {
    borderRadius: 8,
    marginTop: 10,
  },
  loginBtnContent: {
    height: 48,
  },
  loginBtnLabel: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  socialBtn: {
    borderRadius: 8,
    borderWidth: 1.2,
  },
  socialBtnContent: {
    height: 48,
  },
  socialLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
  },

  successMessageText: {
    color: '#22C55E',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
});
