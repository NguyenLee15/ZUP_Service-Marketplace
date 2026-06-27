import { useActiveColors } from '../../hooks/useActiveColors';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Button, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CustomerCard, CustomerHeader, CustomerScreen, InlineMessage } from '../../components/customer/customer-ui';
import { Colors } from '../../constants/colors';
import { userApi } from '../../features/user/user.api';
import { getApiErrorMessage } from '../../lib/api-response';

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function validatePasswordForm(form: PasswordForm) {
  if (!form.currentPassword) return 'Vui lòng nhập mật khẩu hiện tại.';
  if (form.newPassword.length < 6) return 'Mật khẩu mới cần tối thiểu 6 ký tự.';
  if (form.newPassword === form.currentPassword) return 'Mật khẩu mới cần khác mật khẩu hiện tại.';
  if (form.confirmPassword !== form.newPassword) return 'Xác nhận mật khẩu chưa khớp.';
  return '';
}

export default function ChangePasswordScreen() {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const [form, setForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [visible, setVisible] = useState<Record<keyof PasswordForm, boolean>>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState(false);

  const updateForm = (patch: Partial<PasswordForm>) => {
    setForm((current) => ({ ...current, ...patch }));
    setMessage('');
  };

  const toggleVisible = (field: keyof PasswordForm) => {
    setVisible((current) => ({ ...current, [field]: !current[field] }));
    Haptics.selectionAsync().catch(() => {});
  };

  const submit = async () => {
    const error = validatePasswordForm(form);
    if (error) {
      setMessageTone('error');
      setMessage(error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      await userApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessageTone('success');
      setMessage('Đã đổi mật khẩu thành công.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err: any) {
      setMessageTone('error');
      setMessage(getApiErrorMessage(err, 'Không thể đổi mật khẩu.'));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } finally {
      setLoading(false);
    }
  };

  const isLengthValid = form.newPassword.length >= 6;
  const isDifferent = form.newPassword && form.currentPassword ? form.newPassword !== form.currentPassword : true;
  const isMatch = form.confirmPassword ? form.confirmPassword === form.newPassword : false;

  return (
    <CustomerScreen>
      <CustomerHeader title="Đổi mật khẩu" subtitle="Dùng mật khẩu mạnh và không trùng mật khẩu cũ" />
      {message ? <InlineMessage tone={messageTone} message={message} /> : null}

      <View style={styles.securityHeaderContainer}>
        <View style={styles.securityShieldCircle}>
          <MaterialCommunityIcons name="shield-lock-outline" size={44} color={activeColors.primary} />
        </View>
        <Text variant="titleMedium" style={styles.securityHeaderTitle}>
          Bảo mật tài khoản
        </Text>
        <Text variant="bodySmall" style={styles.securityHeaderSubtitle}>
          Thiết lập mật khẩu mạnh để bảo vệ thông tin cá nhân và lịch sử đặt đơn của bạn.
        </Text>
      </View>

      <CustomerCard>
        <View style={styles.form}>
          <PasswordInput
            label="Mật khẩu hiện tại"
            value={form.currentPassword}
            visible={visible.currentPassword}
            onToggle={() => toggleVisible('currentPassword')}
            onChangeText={(currentPassword) => updateForm({ currentPassword })}
          />
          <PasswordInput
            label="Mật khẩu mới"
            value={form.newPassword}
            visible={visible.newPassword}
            onToggle={() => toggleVisible('newPassword')}
            onChangeText={(newPassword) => updateForm({ newPassword })}
            error={Boolean(form.newPassword && form.newPassword.length < 6)}
          />
          <PasswordInput
            label="Xác nhận mật khẩu mới"
            value={form.confirmPassword}
            visible={visible.confirmPassword}
            onToggle={() => toggleVisible('confirmPassword')}
            onChangeText={(confirmPassword) => updateForm({ confirmPassword })}
            error={Boolean(form.confirmPassword && form.confirmPassword !== form.newPassword)}
          />

          <View style={styles.checklistGroup}>
            <Text variant="labelMedium" style={styles.checklistTitle}>
              Yêu cầu mật khẩu
            </Text>
            
            <View style={styles.checklistItem}>
              <MaterialCommunityIcons
                name={isLengthValid ? "check-circle" : "circle-outline"}
                size={18}
                color={isLengthValid ? activeColors.success : activeColors.textSecondary}
              />
              <Text style={[styles.checklistText, isLengthValid && styles.checklistTextSuccess]}>
                Mật khẩu mới tối thiểu 6 ký tự
              </Text>
            </View>

            <View style={styles.checklistItem}>
              <MaterialCommunityIcons
                name={form.newPassword && form.currentPassword ? (isDifferent ? "check-circle" : "close-circle") : "circle-outline"}
                size={18}
                color={form.newPassword && form.currentPassword ? (isDifferent ? activeColors.success : activeColors.error) : activeColors.textSecondary}
              />
              <Text style={[
                styles.checklistText,
                form.newPassword && form.currentPassword ? (isDifferent ? styles.checklistTextSuccess : styles.checklistTextError) : null
              ]}>
                Mật khẩu mới khác mật khẩu hiện tại
              </Text>
            </View>

            <View style={styles.checklistItem}>
              <MaterialCommunityIcons
                name={form.confirmPassword ? (isMatch ? "check-circle" : "close-circle") : "circle-outline"}
                size={18}
                color={form.confirmPassword ? (isMatch ? activeColors.success : activeColors.error) : activeColors.textSecondary}
              />
              <Text style={[
                styles.checklistText,
                form.confirmPassword ? (isMatch ? styles.checklistTextSuccess : styles.checklistTextError) : null
              ]}>
                Xác nhận mật khẩu trùng khớp
              </Text>
            </View>
          </View>

          <Button
            mode="contained"
            loading={loading}
            disabled={loading}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              submit();
            }}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Đổi mật khẩu
          </Button>
        </View>
      </CustomerCard>
    </CustomerScreen>
  );
}

function PasswordInput({
  label,
  value,
  visible,
  error,
  onToggle,
  onChangeText,
}: {
  label: string;
  value: string;
  visible: boolean;
  error?: boolean;
  onToggle: () => void;
  onChangeText: (value: string) => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  return (
    <TextInput
      label={label}
      mode="outlined"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={!visible}
      textContentType="password"
      autoCapitalize="none"
      error={error}
      left={<TextInput.Icon icon="lock-outline" color={activeColors.textSecondary} />}
      right={<TextInput.Icon icon={visible ? 'eye-off-outline' : 'eye-outline'} onPress={onToggle} />}
      outlineStyle={styles.outlineStyle}
      style={styles.textInput}
    />
  );
}

const getStyles = (activeColors: any) => StyleSheet.create({
  form: { gap: 16 },
  button: { borderRadius: 16, backgroundColor: activeColors.primary, marginTop: 8 },
  buttonContent: { height: 48 },
  securityHeaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  securityShieldCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: activeColors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  securityHeaderTitle: {
    color: activeColors.text,
    fontWeight: '900',
  },
  securityHeaderSubtitle: {
    color: activeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  outlineStyle: { borderRadius: 14 },
  textInput: { backgroundColor: activeColors.surface },
  checklistGroup: {
    gap: 8,
    paddingHorizontal: 4,
    marginVertical: 4,
  },
  checklistTitle: {
    color: activeColors.text,
    fontWeight: '800',
    marginBottom: 2,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checklistText: {
    fontSize: 13,
    color: activeColors.textSecondary,
    fontWeight: '600',
  },
  checklistTextSuccess: {
    color: activeColors.success,
  },
  checklistTextError: {
    color: activeColors.error,
  },
});
