export const NEW_ADMIN_DISTRICT_VALUE = 'Không áp dụng';

export interface ProvinceOption {
  name: string;
  wards: string[];
}

interface RawWard {
  name?: unknown;
}

interface RawDistrict {
  wards?: unknown;
}

interface RawProvince {
  name?: unknown;
  wards?: unknown;
  districts?: unknown;
}

export const FALLBACK_ADDRESS_OPTIONS: ProvinceOption[] = [
  {
    name: 'Hà Nội',
    wards: [
      'Phường Ba Đình',
      'Phường Hoàn Kiếm',
      'Phường Cửa Nam',
      'Phường Hai Bà Trưng',
      'Phường Đống Đa',
      'Phường Cầu Giấy',
    ],
  },
  {
    name: 'TP. Hồ Chí Minh',
    wards: [
      'Phường Sài Gòn',
      'Phường Bến Thành',
      'Phường Cầu Ông Lãnh',
      'Phường Bàn Cờ',
      'Phường Bình Thạnh',
      'Phường Gia Định',
    ],
  },
  {
    name: 'Đà Nẵng',
    wards: [
      'Phường Hải Châu',
      'Phường Thanh Khê',
      'Phường Sơn Trà',
      'Phường Ngũ Hành Sơn',
      'Phường Liên Chiểu',
      'Phường Cẩm Lệ',
    ],
  },
];

const PROVINCE_ALIASES: Record<string, string> = {
  'Thành phố Hà Nội': 'Hà Nội',
  'TP Hồ Chí Minh': 'TP. Hồ Chí Minh',
  'TP.Hồ Chí Minh': 'TP. Hồ Chí Minh',
  'Hồ Chí Minh': 'TP. Hồ Chí Minh',
  'Thành phố Hồ Chí Minh': 'TP. Hồ Chí Minh',
  'Thành phố Đà Nẵng': 'Đà Nẵng',
};

function normalizeProvinceName(province: string) {
  return PROVINCE_ALIASES[province] || province;
}

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeWards(rawWards: unknown) {
  if (!Array.isArray(rawWards)) return [];
  return rawWards
    .map((rawWard) => (typeof rawWard === 'string' ? rawWard.trim() : toText((rawWard as RawWard).name)))
    .filter(Boolean);
}

function flattenLegacyWards(rawDistricts: unknown) {
  if (!Array.isArray(rawDistricts)) return [];
  return rawDistricts.flatMap((rawDistrict) => normalizeWards((rawDistrict as RawDistrict).wards));
}

export function normalizeAddressOptions(payload: unknown): ProvinceOption[] {
  if (!Array.isArray(payload)) return FALLBACK_ADDRESS_OPTIONS;

  const options = payload
    .map((rawProvince) => {
      const province = rawProvince as RawProvince;
      const wards = normalizeWards(province.wards);
      const legacyWards = wards.length > 0 ? [] : flattenLegacyWards(province.districts);

      return {
        name: normalizeProvinceName(toText(province.name)),
        wards: wards.length > 0 ? wards : legacyWards,
      };
    })
    .filter((province) => province.name && province.wards.length > 0);

  return options.length > 0 ? options : FALLBACK_ADDRESS_OPTIONS;
}

export function getProvinceOptions(addressOptions: ProvinceOption[] = FALLBACK_ADDRESS_OPTIONS) {
  return addressOptions.map((province) => province.name);
}

export function getWardOptions(province: string, addressOptions: ProvinceOption[] = FALLBACK_ADDRESS_OPTIONS) {
  const normalized = normalizeProvinceName(province);
  return addressOptions.find((item) => item.name === normalized)?.wards || [];
}

export function shouldShowDistrict(district?: string | null) {
  const value = (district || '').trim();
  return Boolean(value && value !== NEW_ADMIN_DISTRICT_VALUE);
}

export function formatAdministrativeArea(province: string, ward: string, district?: string | null) {
  return [ward, shouldShowDistrict(district) ? district : '', province].filter(Boolean).join(', ');
}

export function withCurrentOption(options: string[], current: string) {
  const value = current.trim();
  if (!value || options.includes(value)) return options;
  return [value, ...options];
}
