import { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Button, Text, Searchbar, List } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useActiveColors } from '../../hooks/useActiveColors';
import { ConfirmSheet } from './ConfirmSheet';
import * as Haptics from 'expo-haptics';
import { COMMON_LOCATIONS, LocationSource, UserLocation } from '../../hooks/useUserLocation';

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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLocations = COMMON_LOCATIONS.filter((loc) =>
    loc.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectLocation = (loc: { lat: number; lng: number; label: string }) => {
    Haptics.selectionAsync().catch(() => {});
    onSelectManual(loc.lat, loc.lng, loc.label);
    setSearchQuery('');
    onDismiss();
  };

  const handleSelectGps = () => {
    Haptics.selectionAsync().catch(() => {});
    onSelectGps();
    setSearchQuery('');
    onDismiss();
  };

  return (
    <ConfirmSheet
      visible={visible}
      title="Chọn khu vực"
      description="Tìm dịch vụ quanh khu vực bạn mong muốn"
      onDismiss={() => {
        setSearchQuery('');
        onDismiss();
      }}
      confirmLabel="Đóng"
      onConfirm={() => {
        setSearchQuery('');
        onDismiss();
      }}
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

        <Searchbar
          placeholder="Nhập tên khu vực (VD: Quận 1)..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor={activeColors.textSecondary}
          elevation={0}
        />

        <ScrollView style={styles.listContainer} keyboardShouldPersistTaps="handled">
          {filteredLocations.map((loc) => {
            const isSelected =
              currentLocation.source === 'manual' && currentLocation.label === loc.label;

            return (
              <Pressable
                key={loc.label}
                style={[styles.listItem, isSelected && styles.listItemSelected]}
                onPress={() => handleSelectLocation(loc)}
              >
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={20}
                  color={isSelected ? activeColors.primary : activeColors.textSecondary}
                />
                <Text style={[styles.listItemText, isSelected && styles.listItemTextSelected]}>
                  {loc.label}
                </Text>
                {isSelected && (
                  <MaterialCommunityIcons name="check" size={20} color={activeColors.primary} />
                )}
              </Pressable>
            );
          })}
          
          {filteredLocations.length === 0 && (
            <Text style={styles.emptyText}>Không tìm thấy khu vực nào phù hợp</Text>
          )}
        </ScrollView>
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
  });
