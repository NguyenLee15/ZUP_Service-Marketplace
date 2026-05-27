/**
 * Login screen — Zup Partner (E-commerce Style)
 */
import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Switch, Pressable } from 'react-native';
import { Text, TextInput, Button, useTheme, HelperText, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { authApi } from '../../features/auth/auth.api';
import { useAuthStore } from '../../features/auth/auth.store';
import { useBiometricLogin } from '../../hooks/useBiometricLogin';
import { routes } from '../../lib/route-utils';
import { Colors } from '../../constants/colors';
import { ProviderDialog } from '../../components/provider/provider-ui';
import { t } from '../../lib/i18n';

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const { checkBiometricsSupport, isBiometricsEnabled, enableBiometrics, authenticateAndGetCredentials } = useBiometricLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabledState, setBiometricsEnabledState] = useState(false);

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
  const autoTriggerRef = useRef(true);

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

  useEffect(() => {
    const initBiometrics = async () => {
      const { hasHardware, isEnrolled } = await checkBiometricsSupport();
      const enabled = await isBiometricsEnabled();
      setBiometricsEnabledState(enabled);
      if (hasHardware && isEnrolled) {
        setBiometricsAvailable(true);
        if (enabled && autoTriggerRef.current) {
          autoTriggerRef.current = false;
          // Trigger biometric login automatically
          setTimeout(() => {
            handleBiometricAuth();
          }, 300);
        }
      }
    };
    initBiometrics();
  }, []);

  const handleBiometricAuth = async () => {
    setError('');
    const enabled = await isBiometricsEnabled();
    if (!enabled) {
      showDialog(
        t('auth.biometric_not_enabled'),
        t('auth.biometric_guide')
      );
      setBiometricsEnabledState(false);
      return;
    }

    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const credentials = await authenticateAndGetCredentials();
      if (credentials) {
        setEmail(credentials.email);
        setPassword(credentials.password);
        const res = await authApi.login({ email: credentials.email.trim(), password: credentials.password });
        const { accessToken, refreshToken, user } = res.data.data;

        if (user.role !== 'PROVIDER') {
          setError(t('auth.provider_only_error'));
          isSubmittingRef.current = false;
          setLoading(false);
          setBiometricsEnabledState(false);
          return;
        }

        await setTokens(accessToken, refreshToken);
        setUser(user);
        setBiometricsEnabledState(true);
      } else {
        setBiometricsEnabledState(false);
      }
    } catch (err: any) {
      setError(t('auth.biometric_error'));
      setBiometricsEnabledState(false);
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleLogin = async () => {
    if (isSubmittingRef.current) return;
    if (!email.trim() || !password.trim()) {
      setError(t('auth.validation_error'));
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setError('');

    try {
      const res = await authApi.login({ email: email.trim(), password });
      const { accessToken, refreshToken, user } = res.data.data;

      // Chỉ cho phép Provider đăng nhập
      if (user.role !== 'PROVIDER') {
        setError(t('auth.provider_only_error'));
        return;
      }

      // Check if biometric login is supported but not enabled yet
      const { hasHardware, isEnrolled } = await checkBiometricsSupport();
      const enabled = await isBiometricsEnabled();
      if (hasHardware && isEnrolled && !enabled) {
        showDialog(
          t('auth.biometric_setup'),
          t('auth.biometric_prompt'),
          'Bật ngay',
          async () => {
            await enableBiometrics(email.trim(), password);
            setBiometricsEnabledState(true);
            await setTokens(accessToken, refreshToken);
            setUser(user);
          }
        );
      }

      await setTokens(accessToken, refreshToken);
      setUser(user);
    } catch (err: any) {
      if (!err.response) {
        setError(t('auth.network_error'));
        return;
      }
      const msg = err.response?.data?.error?.message;
      setError(msg || t('auth.login_failed'));
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleGoogleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    showDialog(t('auth.google_login'), t('auth.google_login') + '...');
  };

  const handleFacebookLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    showDialog(t('auth.facebook_login'), t('auth.facebook_login') + '...');
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

      <ScrollView contentContainerStyle={[styles.scrollContent, { backgroundColor: theme.colors.surface }]} keyboardShouldPersistTaps="handled">
        {/* Styled Logo */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/icon.png')}
            style={[styles.logoImage, { backgroundColor: theme.colors.surfaceVariant }]}
            resizeMode="cover"
          />
        </View>

        {/* E-commerce Clean Flat Inputs */}
        <View style={styles.form}>
          <TextInput
            label={t('auth.email_placeholder')}
            value={email}
            onChangeText={setEmail}
            mode="flat"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            left={<TextInput.Icon icon="account-outline" color={theme.colors.onSurfaceVariant} />}
            style={[styles.inputFlat, { backgroundColor: 'transparent' }]}
            underlineColor={theme.colors.outlineVariant}
            activeUnderlineColor={theme.colors.primary}
            textColor={theme.colors.onSurface}
          />

          <View style={styles.passwordWrapper}>
            <TextInput
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              mode="flat"
              secureTextEntry={!showPassword}
              autoComplete="password"
              left={<TextInput.Icon icon="lock-outline" color={theme.colors.onSurfaceVariant} />}
              style={[styles.inputFlat, { backgroundColor: 'transparent' }]}
              underlineColor={theme.colors.outlineVariant}
              activeUnderlineColor={theme.colors.primary}
              textColor={theme.colors.onSurface}
            />
            <View style={styles.passwordRightActions}>
              <IconButton
                icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              />
              <View style={[styles.verticalDivider, { backgroundColor: theme.colors.outlineVariant }]} />
              <Pressable onPress={() => router.push(routes.auth.forgotPassword)}>
                <Text style={[styles.forgotText, { color: theme.colors.primary }]}>{t('auth.forgot_password')}</Text>
              </Pressable>
            </View>
          </View>

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

          <Pressable style={styles.smsBtnWrap} onPress={() => showDialog(t('general.notification'), t('auth.sms_config'))}>
            <Text style={[styles.smsBtnText, { color: theme.colors.primary }]}>{t('auth.sms_login')}</Text>
          </Pressable>

          {/* OR Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
            <Text style={[styles.dividerText, { color: theme.colors.onSurfaceVariant }]}>HOẶC</Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.colors.outlineVariant }]} />
          </View>

          {/* Social login buttons */}
          <View style={styles.socialContainer}>
            <Button
              mode="outlined"
              icon={({ size }) => (
                <Image source={{ uri: 'https://img.icons8.com/color/48/google-logo.png' }} style={{ width: size, height: size }} />
              )}
              onPress={handleGoogleLogin}
              style={[styles.socialBtn, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}
              contentStyle={styles.socialBtnContent}
              labelStyle={[styles.socialLabel, { color: theme.colors.onSurface }]}
            >
              {t('auth.google_login')}
            </Button>

            <Button
              mode="outlined"
              icon={({ size }) => (
                <Image source={{ uri: 'https://img.icons8.com/color/48/facebook-new.png' }} style={{ width: size, height: size }} />
              )}
              onPress={handleFacebookLogin}
              style={[styles.socialBtn, { borderColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}
              contentStyle={styles.socialBtnContent}
              labelStyle={[styles.socialLabel, { color: theme.colors.onSurface }]}
            >
              {t('auth.facebook_login')}
            </Button>
          </View>
        </View>

        {/* Footer Account Registration */}
        <View style={styles.footer}>
          <Text variant="bodyMedium" style={[styles.footerText, { color: theme.colors.onSurfaceVariant }]}>{t('auth.no_account')}</Text>
          <Pressable onPress={() => router.push(routes.auth.register)}>
            <Text style={[styles.registerLink, { color: theme.colors.primary }]}>{t('auth.register')}</Text>
          </Pressable>
        </View>

        {/* Bottom Biometrics Row */}
        {biometricsAvailable && (
          <View style={[styles.biometricFooter, { borderTopColor: theme.colors.outlineVariant }]}>
            <View style={styles.biometricLabelRow}>
              <IconButton icon="fingerprint" size={22} iconColor={theme.colors.onSurfaceVariant} style={styles.bioIcon} />
              <Text variant="bodyMedium" style={[styles.biometricText, { color: theme.colors.onSurfaceVariant }]}>{t('auth.biometric_enable_label')}</Text>
            </View>
            <Switch
              value={biometricsEnabledState}
              onValueChange={async (value) => {
                setBiometricsEnabledState(value);
                if (value) {
                  await handleBiometricAuth();
                } else {
                  showDialog(t('general.notification'), t('auth.biometric_off'));
                }
              }}
              trackColor={{ false: '#CBD5E1', true: '#86EFAC' }}
              thumbColor={biometricsEnabledState ? '#22C55E' : '#F1F5F9'}
            />
          </View>
        )}
      </ScrollView>

      {/* Reusable Provider Dialog */}
      <ProviderDialog
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    height: Platform.OS === 'ios' ? 96 : 76,
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
    paddingHorizontal: 28,
    paddingTop: 36,
    paddingBottom: 40,
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 88,
    height: 88,
    borderRadius: 20,
  },
  form: {
    gap: 16,
  },
  inputFlat: {
    paddingHorizontal: 0,
    height: 56,
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordRightActions: {
    position: 'absolute',
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
  },
  eyeBtn: {
    margin: 0,
  },
  verticalDivider: {
    width: 1,
    height: 20,
    marginHorizontal: 8,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: '600',
    paddingRight: 4,
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
  smsBtnWrap: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  smsBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
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
  socialContainer: {
    gap: 12,
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
    marginTop: 40,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
  biometricFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    marginTop: 'auto',
  },
  biometricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bioIcon: {
    margin: 0,
    padding: 0,
  },
  biometricText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
