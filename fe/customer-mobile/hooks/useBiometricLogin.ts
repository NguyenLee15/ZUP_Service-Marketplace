import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRICS_ENABLED_KEY = 'biometrics_enabled';
const BIOMETRICS_EMAIL_KEY = 'biometrics_email';
const BIOMETRICS_PASSWORD_KEY = 'biometrics_password';

export function useBiometricLogin() {
  const checkBiometricsSupport = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return { hasHardware, isEnrolled };
    } catch {
      return { hasHardware: false, isEnrolled: false };
    }
  };

  const isBiometricsEnabled = async () => {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
      return enabled === 'true';
    } catch {
      return false;
    }
  };

  const getSavedEmail = async () => {
    try {
      return await SecureStore.getItemAsync(BIOMETRICS_EMAIL_KEY);
    } catch {
      return null;
    }
  };

  const enableBiometrics = async (email: string, password: string) => {
    try {
      await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'true');
      await SecureStore.setItemAsync(BIOMETRICS_EMAIL_KEY, email);
      await SecureStore.setItemAsync(BIOMETRICS_PASSWORD_KEY, password);
      return true;
    } catch (error) {
      console.warn('Failed to enable biometrics:', error);
      return false;
    }
  };

  const disableBiometrics = async () => {
    try {
      await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'false');
      await SecureStore.deleteItemAsync(BIOMETRICS_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BIOMETRICS_PASSWORD_KEY);
      return true;
    } catch (error) {
      console.warn('Failed to disable biometrics:', error);
      return false;
    }
  };

  const authenticateAndGetCredentials = async () => {
    try {
      const { hasHardware, isEnrolled } = await checkBiometricsSupport();
      if (!hasHardware || !isEnrolled) return null;

      const enabled = await isBiometricsEnabled();
      if (!enabled) return null;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Xác thực để đăng nhập tài khoản Zup',
        fallbackLabel: 'Nhập mật khẩu',
        disableDeviceFallback: false,
      });

      if (result.success) {
        const email = await SecureStore.getItemAsync(BIOMETRICS_EMAIL_KEY);
        const password = await SecureStore.getItemAsync(BIOMETRICS_PASSWORD_KEY);
        if (email && password) {
          return { email, password };
        }
      }
      return null;
    } catch (error) {
      console.warn('Biometric authentication error:', error);
      return null;
    }
  };

  return {
    checkBiometricsSupport,
    isBiometricsEnabled,
    getSavedEmail,
    enableBiometrics,
    disableBiometrics,
    authenticateAndGetCredentials,
  };
}
