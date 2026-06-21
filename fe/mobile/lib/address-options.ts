export const NEW_ADMIN_DISTRICT_VALUE = 'Không áp dụng';

export interface ProvinceOption {
  name: string;
  wards: string[];
}

export const FALLBACK_ADDRESS_OPTIONS: ProvinceOption[] = [
  {
    name: 'Hà Nội',
    wards: ['Phường Ba Đình', 'Phường Hoàn Kiếm', 'Phường Cửa Nam', 'Phường Hai Bà Trưng', 'Phường Đống Đa', 'Phường Cầu Giấy'],
  },
  {
    name: 'TP. Hồ Chí Minh',
    wards: ['Phường Sài Gòn', 'Phường Bến Thành', 'Phường Cầu Ông Lãnh', 'Phường Bàn Cờ', 'Phường Bình Thạnh', 'Phường Gia Định'],
  },
  {
    name: 'Đà Nẵng',
    wards: ['Phường Hải Châu', 'Phường Thanh Khê', 'Phường Sơn Trà', 'Phường Ngũ Hành Sơn', 'Phường Liên Chiểu', 'Phường Cẩm Lệ'],
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

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeProvinceName(value: string) {
  return PROVINCE_ALIASES[value] || value;
}

function normalizeWards(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const mapped = raw
    .map((ward) => (typeof ward === 'string' ? ward.trim() : text((ward as { name?: unknown }).name)))
    .filter(Boolean);
  return Array.from(new Set(mapped));
}

export function normalizeAddressOptions(payload: unknown): ProvinceOption[] {
  if (!Array.isArray(payload)) return FALLBACK_ADDRESS_OPTIONS;
  const options = payload
    .map((province: any) => {
      const wards = normalizeWards(province?.wards);
      const legacyWards = wards.length ? [] : (province?.districts || []).flatMap((district: any) => normalizeWards(district?.wards));
      return {
        name: normalizeProvinceName(text(province?.name)),
        wards: wards.length ? wards : legacyWards,
      };
    })
    .filter((province) => province.name && province.wards.length > 0);
  return options.length ? options : FALLBACK_ADDRESS_OPTIONS;
}

export function getProvinceOptions(options = FALLBACK_ADDRESS_OPTIONS) {
  return options.map((province) => province.name);
}

export function getWardOptions(province: string, options = FALLBACK_ADDRESS_OPTIONS) {
  const normalized = normalizeProvinceName(province);
  return options.find((item) => item.name === normalized)?.wards || [];
}

export function formatAdministrativeArea(province: string, ward: string, district?: string | null) {
  const districtValue = district && district !== NEW_ADMIN_DISTRICT_VALUE ? district : '';
  return [ward, districtValue, province].filter(Boolean).join(', ');
}
