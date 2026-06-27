import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Button, Text, Searchbar, List } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useActiveColors } from '../../hooks/useActiveColors';
import { ConfirmSheet } from './ConfirmSheet';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../features/user/user.api';
import { normalizeList } from '../../lib/api-response';
import { COMMON_LOCATIONS, LocationSource, UserLocation, getCoordinatesForProvince } from '../../hooks/useUserLocation';

interface AddressItem {
  id: number;
  label?: string | null;
  province?: string | null;
  district?: string | null;
  ward?: string | null;
  addressDetail?: string | null;
  isDefault?: boolean | null;
}

interface LocationPickerProps {
  visible: boolean;
  onDismiss: () => void;
  currentLocation: UserLocation;
  onSelectManual: (lat: number, lng: number, label: string) => void;
  onSelectGps: () => void;
}

export function LocationPicker({
  visible,
  onDismiss,
  currentLocation,
  onSelectManual,
  onSelectGps,
}: LocationPickerProps) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);

  const { data: savedAddresses = [] } = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => normalizeList<AddressItem>(await userApi.getAddresses()),
    enabled: visible,
  });

  const handleSelectGps = () => {
    Haptics.selectionAsync().catch(() => {});
    onSelectGps();
    onDismiss();
  };

  const handleSelectSavedAddress = (address: AddressItem) => {
    Haptics.selectionAsync().catch(() => {});
    const coords = getCoordinatesForProvince(address.province);
    const label = address.label || address.addressDetail || 'Địa chỉ đã lưu';
    onSelectManual(coords.lat, coords.lng, label);
    onDismiss();
  };

  function getAddressIcon(label?: string | null): string {
    const text = String(label || '').toLowerCase();
    if (text.includes('nhà') || text.includes('home')) return 'home-outline';
    if (text.includes('cơ quan') || text.includes('công ty') || text.includes('văn phòng') || text.includes('office') || text.includes('work')) return 'briefcase-outline';
    return 'map-marker-outline';
  }

  return (
    <ConfirmSheet
      visible={visible}
      title="Chọn khu vực"
      description="Tìm dịch vụ quanh khu vực bạn mong muốn"
      onDismiss={onDismiss}
      confirmLabel="Đóng"
      onConfirm={onDismiss}
    >
      <View style={styles.container}>
        <Pressable
          style={[
            styles.gpsButton,
            currentLocation.source === 'gps' && styles.gpsButtonActive,
          ]}
          onPress={handleSelectGps}
        >
          <View style={[styles.gpsIconWrap, currentLocation.source === 'gps' && styles.gpsIconWrapActive]}>
            <MaterialCommunityIcons 
              name="crosshairs-gps" 
              size={20} 
              color={currentLocation.source === 'gps' ? activeColors.primary : activeColors.textSecondary} 
            />
          </View>
          <View style={styles.gpsTextWrap}>
            <Text style={[styles.gpsTitle, currentLocation.source === 'gps' && styles.gpsTitleActive]}>
              Vị trí hiện tại
            </Text>
            <Text style={styles.gpsSubtitle}>Sử dụng định vị thiết bị</Text>
          </View>
          {currentLocation.source === 'gps' && (
            <MaterialCommunityIcons name="check-circle" size={20} color={activeColors.primary} />
          )}
        </Pressable>

        <View style={styles.divider} />

        {savedAddresses.length > 0 ? (
          <View style={styles.savedSection}>
            <Text style={styles.sectionTitle}>ĐỊA CHỈ ĐÃ LƯU</Text>
            {savedAddresses.map((address) => (
              <Pressable
                key={address.id}
                style={[
                  styles.listItem,
                  currentLocation.source === 'manual' && currentLocation.label === (address.label || address.addressDetail) && styles.listItemSelected,
                ]}
                onPress={() => handleSelectSavedAddress(address)}
              >
                <View style={styles.savedIconCircle}>
                  <MaterialCommunityIcons
                    name={getAddressIcon(address.label) as any}
                    size={20}
                    color={activeColors.primary}
                  />
                </View>
                <View style={styles.savedTextWrap}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.savedLabel}>{address.label || 'Địa chỉ'}</Text>
                    {address.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Mặc định</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.savedDetail} numberOfLines={1}>
                    {[address.addressDetail, address.ward, address.district, address.province].filter(Boolean).join(', ')}
                  </Text>
                </View>
                {currentLocation.source === 'manual' && currentLocation.label === (address.label || address.addressDetail) && (
                  <MaterialCommunityIcons name="check" size={20} color={activeColors.primary} />
                )}
              </Pressable>
            ))}
            <View style={styles.divider} />
          </View>
        ) : null}
      </View>
    </ConfirmSheet>
  );
}

const getStyles = (activeColors: any) =>
  StyleSheet.create({
    container: { gap: 12 },
    gpsButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      backgroundColor: activeColors.surfaceVariant,
      gap: 12,
    },
    gpsButtonActive: {
      backgroundColor: activeColors.primarySoft,
      borderColor: activeColors.primary,
      borderWidth: 1,
    },
    gpsIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: activeColors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    gpsIconWrapActive: {
      backgroundColor: activeColors.background,
    },
    gpsTextWrap: { flex: 1 },
    gpsTitle: {
      fontWeight: '700',
      color: activeColors.text,
      fontSize: 16,
    },
    gpsTitleActive: {
      color: activeColors.primary,
    },
    gpsSubtitle: {
      fontSize: 13,
      color: activeColors.textSecondary,
    },
    divider: {
      height: 1,
      backgroundColor: activeColors.border,
      marginVertical: 4,
    },
    searchBar: {
      backgroundColor: activeColors.surfaceVariant,
      borderRadius: 12,
      height: 48,
    },
    searchInput: {
      fontSize: 15,
    },
    listContainer: {
      maxHeight: 280,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      gap: 12,
      borderRadius: 8,
    },
    listItemSelected: {
      backgroundColor: activeColors.primarySoft,
    },
    listItemText: {
      flex: 1,
      fontSize: 15,
      color: activeColors.text,
    },
    listItemTextSelected: {
      color: activeColors.primary,
      fontWeight: '700',
    },
    emptyText: {
      textAlign: 'center',
      color: activeColors.textSecondary,
      paddingVertical: 24,
    },
    savedSection: {
      gap: 4,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: activeColors.textSecondary,
      marginLeft: 4,
      marginTop: 4,
      marginBottom: 4,
    },
    savedIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: activeColors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    savedTextWrap: {
      flex: 1,
    },
    savedLabel: {
      fontWeight: '700',
      color: activeColors.text,
      fontSize: 15,
    },
    savedDetail: {
      fontSize: 13,
      color: activeColors.textSecondary,
      marginTop: 2,
    },
    defaultBadge: {
      backgroundColor: '#DCFCE7',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    defaultBadgeText: {
      color: '#15803D',
      fontSize: 10,
      fontWeight: '800',
    },
  });
