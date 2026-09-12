import { StyleSheet, View } from 'react-native';
import { Avatar, Button, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../features/auth/auth.store';
import { authApi } from '../../features/auth/auth.api';
import { Colors } from '../../constants/colors';
import { routes } from '../../lib/route-utils';
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
  const activeColors = theme.dark ? Colors.dark : Colors.light;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {}
    await logout();
  };

  const profileSections = [
    {
      title: 'Hồ sơ & Chuyên môn',
      items: [
        { icon: 'account-edit-outline', label: 'Chỉnh sửa hồ sơ', description: 'Tên, số điện thoại và thông tin liên hệ', route: routes.profile.edit },
        { icon: 'map-marker-radius-outline', label: 'Địa chỉ hoạt động', description: 'Cửa hàng, công ty hoặc nhà riêng để khách liên hệ', route: '/profile/addresses' as any },
        { icon: 'card-account-details-outline', label: 'Xác thực tài khoản', description: 'CCCD và chân dung để mở đầy đủ tính năng', route: routes.profile.kyc },
        { icon: 'briefcase-outline', label: 'Dịch vụ của tôi', description: 'Quản lý giá, trạng thái và đánh giá', route: routes.services },
        { icon: 'chart-areaspline', label: 'Hiệu suất & doanh thu', description: 'Theo dõi thu nhập ròng, đánh giá và tỉ lệ chốt đơn', route: routes.profile.analytics },
      ],
    },
    {
      title: 'Hệ thống & Cài đặt',
      items: [
        { icon: 'lock-reset', label: 'Đổi mật khẩu', description: 'Cập nhật mật khẩu đăng nhập', route: routes.profile.changePassword },
        { icon: 'bell-outline', label: 'Thông báo', description: 'Xem thông báo đơn hàng và hệ thống', route: routes.notifications },
      ],
    },
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
            style={[styles.avatar, { backgroundColor: `${activeColors.primary}14` }]}
            color={activeColors.primary}
          />
        )}
        <View style={styles.accountInfo}>
          <Text variant="titleLarge" style={[styles.name, { color: activeColors.text }]} selectable>
            {user?.fullName || 'Provider'}
          </Text>
          <Text variant="bodyMedium" style={[styles.email, { color: activeColors.textSecondary }]} selectable>
            {user?.email || 'Chưa có email'}
          </Text>
          <View style={styles.statusRow}>
            <ProviderStatusChip
              label={user?.status === 'ACTIVE' ? 'Đang hoạt động' : user?.status || 'Chưa rõ trạng thái'}
              color={user?.status === 'ACTIVE' ? activeColors.success : activeColors.warning}
            />
          </View>
        </View>
      </ProviderCard>

      <ProviderInlineMessage
        tone="info"
        icon="shield-check-outline"
        message="Hoàn tất KYC và giữ dịch vụ đang hoạt động để nhận đơn ổn định hơn."
      />

      {profileSections.map((section) => (
        <View key={section.title} style={styles.sectionBlock}>
          <Text variant="labelLarge" style={[styles.sectionHeading, { color: activeColors.textSecondary }]}>
            {section.title}
          </Text>
          <ProviderCard contentStyle={styles.groupedCardContent}>
            {section.items.map((item, index) => (
              <View key={item.label}>
                <TouchableRipple
                  onPress={() => router.push(item.route)}
                  accessibilityLabel={item.label}
                  style={styles.menuRow}
                >
                  <View style={styles.menuItem}>
                    <View style={[styles.menuIcon, { backgroundColor: `${theme.colors.primary}12` }]}>
                      <MaterialCommunityIcons name={item.icon as any} size={22} color={theme.colors.primary} />
                    </View>
                    <View style={styles.menuText}>
                      <Text variant="bodyLarge" style={[styles.menuLabel, { color: activeColors.text }]}>
                        {item.label}
                      </Text>
                      <Text variant="bodySmall" style={[styles.menuDescription, { color: activeColors.textSecondary }]} numberOfLines={1}>
                        {item.description}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={22} color={activeColors.textSecondary} />
                  </View>
                </TouchableRipple>
                {index < section.items.length - 1 && (
                  <View style={[styles.hairlineDivider, { backgroundColor: theme.colors.outlineVariant }]} />
                )}
              </View>
            ))}
          </ProviderCard>
        </View>
      ))}

      <Button
        mode="outlined"
        onPress={handleLogout}
        style={[styles.logoutButton, { borderColor: theme.colors.error }]}
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
    gap: 16,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
  },
  accountInfo: {
    flex: 1,
    minWidth: 0,
  },
  name: { fontWeight: '800' },
  email: { marginTop: 2 },
  statusRow: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  sectionBlock: {
    gap: 8,
  },
  sectionHeading: {
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.3,
    marginLeft: 4,
  },
  groupedCardContent: {
    padding: 0,
  },
  menuRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
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
  menuLabel: { fontWeight: '700' },
  menuDescription: { marginTop: 2, lineHeight: 18 },
  hairlineDivider: {
    height: 1,
    marginLeft: 68,
  },
  logoutButton: {
    borderRadius: 12,
    marginTop: 8,
  },
});
