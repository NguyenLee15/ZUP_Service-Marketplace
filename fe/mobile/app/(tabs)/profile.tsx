import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../features/auth/auth.store';
import { authApi } from '../../features/auth/auth.api';
import { Colors } from '../../constants/colors';
import {
  ProviderCard,
  ProviderInlineMessage,
  ProviderPageHeader,
  ProviderScreen,
  ProviderStatusChip,
} from '../../components/provider/provider-ui';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    await logout();
  };

  const menuItems = [
    { icon: 'account-edit-outline', label: 'Chỉnh sửa hồ sơ', description: 'Tên, số điện thoại và thông tin liên hệ', route: '/profile/edit' },
    { icon: 'card-account-details-outline', label: 'Xác thực tài khoản', description: 'CCCD và chân dung để mở đầy đủ tính năng', route: '/profile/kyc' },
    { icon: 'briefcase-outline', label: 'Dịch vụ của tôi', description: 'Quản lý giá, trạng thái và đánh giá', route: '/services' },
    { icon: 'lock-reset', label: 'Đổi mật khẩu', description: 'Cập nhật mật khẩu đăng nhập', route: '/profile/change-password' },
    { icon: 'bell-outline', label: 'Thông báo', description: 'Xem thông báo đơn hàng và hệ thống', route: '/notifications' },
  ];

  return (
    <ProviderScreen scroll contentStyle={styles.content}>
      <ProviderPageHeader title="Tài khoản" subtitle="Quản lý hồ sơ, bảo mật và trạng thái vận hành." />

      <ProviderCard contentStyle={styles.accountCard}>
        {user?.avatarUrl ? (
          <Avatar.Image size={64} source={{ uri: user.avatarUrl }} />
        ) : (
          <Avatar.Text
            size={64}
            label={user?.fullName?.charAt(0)?.toUpperCase() || 'P'}
            style={styles.avatar}
            color={Colors.light.primary}
          />
        )}
        <View style={styles.accountInfo}>
          <Text variant="titleLarge" style={styles.name} selectable>
            {user?.fullName || 'Provider'}
          </Text>
          <Text variant="bodyMedium" style={styles.email} selectable>
            {user?.email || 'Chưa có email'}
          </Text>
          <View style={styles.statusRow}>
            <ProviderStatusChip
              label={user?.status === 'ACTIVE' ? 'Đang hoạt động' : user?.status || 'Chưa rõ trạng thái'}
              color={user?.status === 'ACTIVE' ? Colors.light.success : Colors.light.warning}
            />
          </View>
        </View>
      </ProviderCard>

      <ProviderInlineMessage
        tone="info"
        icon="shield-check-outline"
        message="Hoàn tất KYC và giữ dịch vụ đang hoạt động để nhận đơn ổn định hơn."
      />

      <View style={styles.menuStack}>
        {menuItems.map(item => (
          <ProviderCard key={item.label} onPress={() => router.push(item.route as any)} accessibilityLabel={item.label}>
            <View style={styles.menuItem}>
              <View style={[styles.menuIcon, { backgroundColor: `${theme.colors.primary}12` }]}>
                <MaterialCommunityIcons name={item.icon as any} size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.menuText}>
                <Text variant="bodyLarge" style={styles.menuLabel}>
                  {item.label}
                </Text>
                <Text variant="bodySmall" style={styles.menuDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.light.textSecondary} />
            </View>
          </ProviderCard>
        ))}
      </View>

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={styles.logoutButton}
        textColor={theme.colors.error}
        icon="logout"
        accessibilityLabel="Đăng xuất"
      >
        Đăng xuất
      </Button>
    </ProviderScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    backgroundColor: `${Colors.light.primary}14`,
  },
  accountInfo: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: Colors.light.text,
    fontWeight: '800',
  },
  email: {
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  statusRow: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  menuStack: {
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuText: {
    flex: 1,
    minWidth: 0,
  },
  menuLabel: {
    color: Colors.light.text,
    fontWeight: '700',
  },
  menuDescription: {
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  logoutButton: {
    borderColor: Colors.light.error,
    borderRadius: 12,
    marginTop: 8,
  },
});
