import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Modal, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Text, Searchbar, Button, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import MapView, { Region } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import { useActiveColors } from '../../hooks/useActiveColors';
import { EmptyState } from './customer-ui';

export type NominatimPlace = {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    state?: string;
    country?: string;
  };
};

export function AddressAutocompleteModal({
  visible,
  onDismiss,
  onSelect,
}: {
  visible: boolean;
  onDismiss: () => void;
  onSelect: (place: NominatimPlace) => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimPlace[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query
          )}&format=json&addressdetails=1&countrycodes=vn&limit=5`,
          {
            headers: {
              'Accept-Language': 'vi-VN,vi;q=0.9',
              'User-Agent': 'ServiceMarketplaceApp/1.0',
            },
          }
        );
        const data = await res.json();
        setResults(data);
      } catch (err) {
        console.error('Nominatim error', err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.fullscreenModal}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" iconColor={activeColors.text} onPress={onDismiss} />
          <Text variant="titleMedium" style={styles.headerTitle}>
            Địa chỉ mới
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Tên đường, Toà nhà, Số nhà."
            value={query}
            onChangeText={setQuery}
            style={styles.searchbar}
            autoFocus
          />
        </View>

        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={activeColors.primary} />
          </View>
        ) : results.length > 0 ? (
          <View style={styles.resultsContainer}>
            <Text style={styles.suggestionsLabel}>Các địa điểm được đề xuất dựa trên địa chỉ bạn nhập vào</Text>
            <FlatList
              data={results}
              keyExtractor={(item) => String(item.place_id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={styles.resultItem}
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    onSelect(item);
                  }}
                >
                  <MaterialCommunityIcons name="map-marker" size={20} color={activeColors.borderStrong} />
                  <Text style={styles.resultText} numberOfLines={2}>
                    {item.display_name}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        ) : query.trim() ? (
          <View style={styles.centerBox}>
            <EmptyState title="Không tìm thấy" description="Hãy thử một tên gọi khác hoặc tên đường lớn gần đó." />
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

export function RegionPickerModal({
  visible,
  provinceOptions,
  getWardOptions,
  onDismiss,
  onSelectCurrentLocation,
  onSelectRegion,
}: {
  visible: boolean;
  provinceOptions: string[];
  getWardOptions: (province: string) => string[];
  onDismiss: () => void;
  onSelectCurrentLocation: (data: { province: string; ward: string; addressDetail: string; lat: number; lng: number }) => void;
  onSelectRegion: (province: string, ward: string) => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const [step, setStep] = useState<'province' | 'ward'>('province');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [query, setQuery] = useState('');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep('province');
      setSelectedProvince('');
      setQuery('');
    }
  }, [visible]);

  const wardOptions = useMemo(() => {
    if (!selectedProvince) return [];
    return getWardOptions(selectedProvince);
  }, [selectedProvince, getWardOptions]);

  const currentOptions = step === 'province' ? provinceOptions : wardOptions;
  const filtered = useMemo(() => {
    return currentOptions.filter((opt) => opt.toLowerCase().includes(query.trim().toLowerCase()));
  }, [currentOptions, query]);

  const handleUseCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền bị từ chối', 'Vui lòng cấp quyền truy cập vị trí trong cài đặt thiết bị để sử dụng tính năng này.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (!geo) {
        Alert.alert('Lỗi', 'Không thể xác định địa chỉ hiện tại.');
        return;
      }

      const province = geo.region || geo.subregion || geo.city || '';
      const ward = geo.district || geo.city || '';
      const addressDetail = [geo.name, geo.street, geo.streetNumber].filter(Boolean).join(', ');

      onSelectCurrentLocation({
        province,
        ward,
        addressDetail,
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại.');
    } finally {
      setLocating(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View style={styles.sheet}>
        <View style={styles.dragIndicator} />
        <View style={styles.sheetHeader}>
          <IconButton
            icon={step === 'ward' ? 'arrow-left' : 'close'}
            iconColor={activeColors.textSecondary}
            onPress={() => {
              if (step === 'ward') {
                setStep('province');
                setQuery('');
              } else {
                onDismiss();
              }
            }}
          />
          <Text variant="titleMedium" style={styles.title}>
            {step === 'province' ? 'Tỉnh/Thành Phố' : 'Phường/Xã'}
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <Searchbar
          placeholder={`Tìm kiếm ${step === 'province' ? 'Tỉnh/Thành Phố' : 'Phường/Xã'}`}
          value={query}
          onChangeText={setQuery}
          style={styles.search}
          elevation={0}
        />

        {step === 'province' && !query && (
          <Pressable style={styles.currentLocationBtn} onPress={handleUseCurrentLocation} disabled={locating}>
            {locating ? (
              <ActivityIndicator size="small" color={activeColors.primary} />
            ) : (
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color={activeColors.primary} />
            )}
            <Text style={[styles.currentLocationText, { color: activeColors.primary }]}>
              {locating ? 'Đang lấy vị trí...' : 'Sử dụng vị trí hiện tại của tôi'}
            </Text>
          </Pressable>
        )}

        <FlatList
          data={filtered}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <Pressable
              style={styles.optionRow}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                if (step === 'province') {
                  setSelectedProvince(item);
                  setStep('ward');
                  setQuery('');
                } else {
                  onSelectRegion(selectedProvince, item);
                }
              }}
            >
              <Text style={styles.optionText}>{item}</Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

export function LocationConfirmationModal({
  visible,
  initialLocation,
  onDismiss,
  onConfirm,
}: {
  visible: boolean;
  initialLocation?: { lat: number; lng: number; addressName: string } | null;
  onDismiss: () => void;
  onConfirm: (lat: number, lng: number, addressName: string) => void;
}) {
  const activeColors = useActiveColors();
  const styles = getStyles(activeColors);
  const [region, setRegion] = React.useState<Region | null>(null);
  const [addressName, setAddressName] = React.useState('');
  const mapRef = React.useRef<MapView>(null);

  useEffect(() => {
    if (visible && initialLocation) {
      setRegion({
        latitude: initialLocation.lat,
        longitude: initialLocation.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
      setAddressName(initialLocation.addressName);
    }
  }, [visible, initialLocation]);

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
  };

  const handleConfirm = () => {
    if (region) {
      onConfirm(region.latitude, region.longitude, addressName);
    }
  };

  const goToCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newReg = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      };
      setRegion(newReg);
      mapRef.current?.animateToRegion(newReg);
    } catch (e) {}
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.fullscreenModal}>
        <View style={styles.header}>
          <IconButton icon="arrow-left" iconColor={activeColors.text} onPress={onDismiss} />
          <Text variant="titleMedium" style={styles.headerTitle}>
            Địa chỉ mới
          </Text>
        </View>

        <View style={styles.mapContainer}>
          {region && (
            <MapView
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              initialRegion={region}
              onRegionChangeComplete={handleRegionChangeComplete}
              showsUserLocation
              showsMyLocationButton={false}
            />
          )}

          <View style={styles.mapSearchOverlay}>
            <View style={styles.mapSearchBox}>
              <Text style={styles.mapSearchLabel}>Nhập Địa Chỉ</Text>
              <View style={styles.rowAlign}>
                <Text style={styles.mapSearchValue} numberOfLines={2}>
                  {addressName}
                </Text>
                <Text style={styles.mapSearchChangeBtn}>Đổi {'>'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.centerMarkerContainer} pointerEvents="none">
            <View style={styles.markerTooltip}>
              <Text style={styles.markerTooltipTitle}>Địa chỉ của bạn ở đây</Text>
              <Text style={styles.markerTooltipDesc}>Vui lòng kiểm tra vị trí trên bản đồ</Text>
              <View style={styles.markerTooltipArrow} />
            </View>
            <MaterialCommunityIcons name="map-marker" size={44} color="#EA580C" style={styles.centerMarkerIcon} />
          </View>

          <View style={styles.mapCurrentLocationBtn}>
            <IconButton
              icon="crosshairs-gps"
              size={24}
              mode="contained"
              containerColor="white"
              iconColor={activeColors.text}
              onPress={goToCurrentLocation}
              style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 }}
            />
          </View>
        </View>

        <View style={styles.mapFooter}>
          <Button mode="contained" style={styles.confirmMapButton} labelStyle={styles.confirmMapButtonLabel} onPress={handleConfirm}>
            Xác Nhận
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (activeColors: any) =>
  StyleSheet.create({
    fullscreenModal: { flex: 1, backgroundColor: activeColors.surface },
    header: { flexDirection: 'row', alignItems: 'center', height: 56, backgroundColor: activeColors.surface },
    headerTitle: { color: activeColors.text, fontWeight: '600' },
    searchContainer: { paddingHorizontal: 16, paddingBottom: 8 },
    searchbar: { backgroundColor: activeColors.surfaceVariant, borderRadius: 8, height: 44 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    resultsContainer: { flex: 1 },
    suggestionsLabel: { padding: 16, fontSize: 13, color: activeColors.textSecondary, backgroundColor: activeColors.background },
    resultItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: activeColors.border, gap: 12 },
    resultText: { flex: 1, fontSize: 14, color: activeColors.text },
    
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '80%', backgroundColor: activeColors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    dragIndicator: { width: 40, height: 4, backgroundColor: activeColors.borderStrong, borderRadius: 2, alignSelf: 'center', marginTop: 8 },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontWeight: '600', color: activeColors.text },
    search: { marginHorizontal: 16, marginBottom: 8, backgroundColor: activeColors.surfaceVariant, height: 40, borderRadius: 8 },
    currentLocationBtn: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: activeColors.border, gap: 12 },
    currentLocationText: { fontSize: 15, fontWeight: '500' },
    optionRow: { padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: activeColors.border },
    optionText: { fontSize: 15, color: activeColors.text },
    mapContainer: { flex: 1, backgroundColor: activeColors.surfaceVariant, position: 'relative' },
    mapSearchOverlay: { position: 'absolute', top: 16, left: 16, right: 16, zIndex: 10 },
    mapSearchBox: { backgroundColor: 'white', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
    mapSearchLabel: { fontSize: 12, color: activeColors.textSecondary, marginBottom: 4 },
    mapSearchValue: { fontSize: 14, color: activeColors.text, flex: 1 },
    mapSearchChangeBtn: { fontSize: 14, color: activeColors.primary, marginLeft: 8 },
    centerMarkerContainer: { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -100 }, { translateY: -100 }], width: 200, height: 100, alignItems: 'center', justifyContent: 'flex-end', zIndex: 5 },
    markerTooltip: { backgroundColor: '#EA580C', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 24, alignItems: 'center', marginBottom: 4 },
    markerTooltipTitle: { color: 'white', fontWeight: 'bold', fontSize: 13 },
    markerTooltipDesc: { color: 'rgba(255,255,255,0.9)', fontSize: 11 },
    markerTooltipArrow: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#EA580C', position: 'absolute', bottom: -8 },
    centerMarkerIcon: { marginTop: -4 },
    mapCurrentLocationBtn: { position: 'absolute', bottom: 24, right: 16, zIndex: 10 },
    mapFooter: { padding: 16, backgroundColor: 'white', borderTopWidth: 1, borderColor: activeColors.borderLight },
    confirmMapButton: { borderRadius: 8, paddingVertical: 4, backgroundColor: '#EA580C' },
    confirmMapButtonLabel: { fontSize: 16, fontWeight: 'bold' },
    rowAlign: { flexDirection: 'row', alignItems: 'center' },
  });
