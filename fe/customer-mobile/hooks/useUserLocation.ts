import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export type LocationSource = 'gps' | 'manual' | 'fallback' | 'all';

export interface UserLocation {
  lat?: number;
  lng?: number;
  source: LocationSource;
  label?: string;
}

// Fallback: Toàn quốc by default so all services show up
export const DEFAULT_LOCATION: UserLocation = {
  source: 'all',
  label: 'Toàn quốc',
};

// Common districts for hardcoded selection
export const COMMON_LOCATIONS: { label: string; lat: number; lng: number }[] = [
  { label: 'Hà Nội', lat: 21.0285, lng: 105.8522 },
  { label: 'Quận Ba Đình, Hà Nội', lat: 21.0336, lng: 105.8277 },
  { label: 'Quận Cầu Giấy, Hà Nội', lat: 21.0285, lng: 105.7951 },
  { label: 'Quận Đống Đa, Hà Nội', lat: 21.0182, lng: 105.8242 },
  { label: 'Quận Hai Bà Trưng, Hà Nội', lat: 21.0094, lng: 105.8520 },
  { label: 'Quận Hoàn Kiếm, Hà Nội', lat: 21.0288, lng: 105.8526 },
  { label: 'Quận Hoàng Mai, Hà Nội', lat: 20.9765, lng: 105.8505 },
  { label: 'Quận Long Biên, Hà Nội', lat: 21.0428, lng: 105.8858 },
  { label: 'Quận Tây Hồ, Hà Nội', lat: 21.0664, lng: 105.8223 },
  { label: 'Quận Thanh Xuân, Hà Nội', lat: 20.9937, lng: 105.8143 },
  { label: 'Quận Nam Từ Liêm, Hà Nội', lat: 21.0125, lng: 105.7607 },
  { label: 'Quận Bắc Từ Liêm, Hà Nội', lat: 21.0652, lng: 105.7647 },
  { label: 'Hồ Chí Minh', lat: 10.8231, lng: 106.6297 },
  { label: 'Quận 1, TP.HCM', lat: 10.7769, lng: 106.7009 },
  { label: 'Quận 3, TP.HCM', lat: 10.7818, lng: 106.6853 },
  { label: 'Quận 4, TP.HCM', lat: 10.7604, lng: 106.7031 },
  { label: 'Quận 7, TP.HCM', lat: 10.7335, lng: 106.7262 },
  { label: 'Quận 10, TP.HCM', lat: 10.7738, lng: 106.6669 },
  { label: 'Quận Tân Bình, TP.HCM', lat: 10.8015, lng: 106.6526 },
  { label: 'Quận Phú Nhuận, TP.HCM', lat: 10.7963, lng: 106.6816 },
  { label: 'Quận Bình Thạnh, TP.HCM', lat: 10.8037, lng: 106.7029 },
  { label: 'Quận Gò Vấp, TP.HCM', lat: 10.8286, lng: 106.6713 },
  { label: 'TP. Thủ Đức, TP.HCM', lat: 10.8496, lng: 106.7561 },
  { label: 'Đà Nẵng', lat: 16.0544, lng: 108.2022 },
  { label: 'Quận Hải Châu, Đà Nẵng', lat: 16.0519, lng: 108.2163 },
  { label: 'Quận Thanh Khê, Đà Nẵng', lat: 16.0645, lng: 108.1884 },
  { label: 'Quận Sơn Trà, Đà Nẵng', lat: 16.0825, lng: 108.2435 },
  { label: 'Hải Phòng', lat: 20.8449, lng: 106.6881 },
  { label: 'Cần Thơ', lat: 10.0452, lng: 105.7469 },
];

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchGpsLocation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Quyền truy cập vị trí bị từ chối');
        setLocation(DEFAULT_LOCATION);
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        source: 'gps',
        label: 'Vị trí hiện tại',
      });
    } catch (err) {
      console.error('Error fetching location', err);
      setErrorMsg('Không thể lấy vị trí hiện tại');
      setLocation(DEFAULT_LOCATION);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGpsLocation();
  }, []);

  const setManualLocation = (lat: number, lng: number, label: string) => {
    setLocation({ lat, lng, source: 'manual', label });
  };

  const clearLocation = () => {
    setLocation({ source: 'all', label: 'Toàn quốc' });
  };

  const resetToGps = () => {
    fetchGpsLocation();
  };

  return {
    location,
    loading,
    errorMsg,
    setManualLocation,
    clearLocation,
    resetToGps,
  };
}

export function getCoordinatesForProvince(province: string | null | undefined): { lat: number; lng: number } {
  if (!province) return { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng };
  
  // Try to find exact or partial match in COMMON_LOCATIONS
  // E.g. "Hà Nội" or "Thành phố Hồ Chí Minh" -> "Hồ Chí Minh"
  const normalizedSearch = province.toLowerCase();
  
  const match = COMMON_LOCATIONS.find(loc => 
    normalizedSearch.includes(loc.label.toLowerCase()) || 
    loc.label.toLowerCase().includes(normalizedSearch) ||
    (normalizedSearch.includes('hồ chí minh') && loc.label === 'Hồ Chí Minh')
  );
  
  if (match) {
    return { lat: match.lat, lng: match.lng };
  }
  
  return { lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng };
}
