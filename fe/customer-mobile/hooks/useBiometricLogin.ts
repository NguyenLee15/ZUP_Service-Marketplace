import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRICS_ENABLED_KEY = 'biometrics_enabled';

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

  const enableBiometrics = async () => {
    try {
      await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'true');
      return true;
    } catch (error) {
      if (__DEV__) console.warn('Failed to enable biometrics:', error);
      return false;
    }
  };

  const disableBiometrics = async () => {
    try {
      await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, 'false');
      return true;
    } catch (error) {
      if (__DEV__) console.warn('Failed to disable biometrics:', error);
      return false;
    }
  };

  const authenticate = async () => {
    try {
      const { hasHardware, isEnrolled } = await checkBiometricsSupport();
      if (!hasHardware || !isEnrolled) return false;

      const enabled = await isBiometricsEnabled();
      if (!enabled) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Xác thực để đăng nhập tài khoản Zup',
        fallbackLabel: 'Nhập mật khẩu',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      if (__DEV__) console.warn('Biometric authentication error:', error);
      return false;
    }
  };

  return {
    checkBiometricsSupport,
    isBiometricsEnabled,
    enableBiometrics,
    disableBiometrics,
    authenticate,
  };
}
