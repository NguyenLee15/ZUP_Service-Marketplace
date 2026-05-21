export interface DistrictOption {
  name: string;
  wards: string[];
}

export interface ProvinceOption {
  name: string;
  districts: DistrictOption[];
}

interface RawWard {
  name?: unknown;
}

interface RawDistrict {
  name?: unknown;
  wards?: unknown;
}

interface RawProvince {
  name?: unknown;
  districts?: unknown;
}

export const FALLBACK_ADDRESS_OPTIONS: ProvinceOption[] = [
  {
    name: 'Hà Nội',
    districts: [
      {
        name: 'Quận Hoàn Kiếm',
        wards: ['Phường Hàng Bạc', 'Phường Hàng Bài', 'Phường Hàng Bồ', 'Phường Hàng Gai', 'Phường Hàng Trống', 'Phường Tràng Tiền'],
      },
      {
        name: 'Quận Ba Đình',
        wards: ['Phường Cống Vị', 'Phường Đội Cấn', 'Phường Điện Biên', 'Phường Giảng Võ', 'Phường Kim Mã', 'Phường Ngọc Hà'],
      },
      {
        name: 'Quận Đống Đa',
        wards: ['Phường Cát Linh', 'Phường Láng Hạ', 'Phường Ô Chợ Dừa', 'Phường Quang Trung', 'Phường Thịnh Quang', 'Phường Trung Liệt'],
      },
      {
        name: 'Quận Cầu Giấy',
        wards: ['Phường Dịch Vọng', 'Phường Dịch Vọng Hậu', 'Phường Mai Dịch', 'Phường Nghĩa Đô', 'Phường Nghĩa Tân', 'Phường Yên Hòa'],
      },
      {
        name: 'Quận Hai Bà Trưng',
        wards: ['Phường Bạch Đằng', 'Phường Bách Khoa', 'Phường Bùi Thị Xuân', 'Phường Minh Khai', 'Phường Thanh Lương', 'Phường Trương Định'],
      },
      {
        name: 'Quận Thanh Xuân',
        wards: ['Phường Hạ Đình', 'Phường Khương Đình', 'Phường Khương Mai', 'Phường Nhân Chính', 'Phường Thanh Xuân Bắc', 'Phường Thanh Xuân Trung'],
      },
    ],
  },
  {
    name: 'TP. Hồ Chí Minh',
    districts: [
      {
        name: 'Quận 1',
        wards: ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Cầu Kho', 'Phường Cầu Ông Lãnh', 'Phường Đa Kao', 'Phường Nguyễn Cư Trinh'],
      },
      {
        name: 'Quận 3',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 5', 'Phường 9', 'Phường Võ Thị Sáu'],
      },
      {
        name: 'Quận 7',
        wards: ['Phường Bình Thuận', 'Phường Phú Mỹ', 'Phường Phú Thuận', 'Phường Tân Hưng', 'Phường Tân Phong', 'Phường Tân Quy'],
      },
      {
        name: 'Quận Bình Thạnh',
        wards: ['Phường 1', 'Phường 2', 'Phường 5', 'Phường 11', 'Phường 19', 'Phường 25'],
      },
      {
        name: 'Tân Bình',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 12', 'Phường 13', 'Phường 15'],
      },
      {
        name: 'Quận Phú Nhuận',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 7', 'Phường 9', 'Phường 15'],
      },
      {
        name: 'Quận Gò Vấp',
        wards: ['Phường 1', 'Phường 3', 'Phường 5', 'Phường 10', 'Phường 16', 'Phường 17'],
      },
      {
        name: 'Thành phố Thủ Đức',
        wards: ['Phường An Khánh', 'Phường Bình Thọ', 'Phường Hiệp Bình Chánh', 'Phường Linh Chiểu', 'Phường Linh Trung', 'Phường Thảo Điền'],
      },
    ],
  },
  {
    name: 'Đà Nẵng',
    districts: [
      {
        name: 'Quận Hải Châu',
        wards: ['Phường Bình Hiên', 'Phường Bình Thuận', 'Phường Hải Châu 1', 'Phường Hải Châu 2', 'Phường Hòa Cường Bắc', 'Phường Thạch Thang'],
      },
      {
        name: 'Quận Thanh Khê',
        wards: ['Phường An Khê', 'Phường Chính Gián', 'Phường Hòa Khê', 'Phường Tam Thuận', 'Phường Tân Chính', 'Phường Vĩnh Trung'],
      },
      {
        name: 'Quận Sơn Trà',
        wards: ['Phường An Hải Bắc', 'Phường An Hải Đông', 'Phường An Hải Tây', 'Phường Mân Thái', 'Phường Nại Hiên Đông', 'Phường Thọ Quang'],
      },
      {
        name: 'Quận Ngũ Hành Sơn',
        wards: ['Phường Hòa Hải', 'Phường Hòa Quý', 'Phường Khuê Mỹ', 'Phường Mỹ An'],
      },
      {
        name: 'Quận Liên Chiểu',
        wards: ['Phường Hòa Hiệp Bắc', 'Phường Hòa Hiệp Nam', 'Phường Hòa Khánh Bắc', 'Phường Hòa Khánh Nam', 'Phường Hòa Minh'],
      },
      {
        name: 'Quận Cẩm Lệ',
        wards: ['Phường Hòa An', 'Phường Hòa Phát', 'Phường Hòa Thọ Đông', 'Phường Hòa Thọ Tây', 'Phường Khuê Trung'],
      },
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

const DISTRICT_ALIASES: Record<string, string> = {
  'Hoàn Kiếm': 'Quận Hoàn Kiếm',
  'Ba Đình': 'Quận Ba Đình',
  'Đống Đa': 'Quận Đống Đa',
  'Cầu Giấy': 'Quận Cầu Giấy',
  'Hai Bà Trưng': 'Quận Hai Bà Trưng',
  'Thanh Xuân': 'Quận Thanh Xuân',
  'Bình Thạnh': 'Quận Bình Thạnh',
  'Phú Nhuận': 'Quận Phú Nhuận',
  'Gò Vấp': 'Quận Gò Vấp',
  'Thủ Đức': 'Thành phố Thủ Đức',
  'Hải Châu': 'Quận Hải Châu',
  'Thanh Khê': 'Quận Thanh Khê',
  'Sơn Trà': 'Quận Sơn Trà',
  'Ngũ Hành Sơn': 'Quận Ngũ Hành Sơn',
  'Liên Chiểu': 'Quận Liên Chiểu',
  'Cẩm Lệ': 'Quận Cẩm Lệ',
};

function normalizeProvinceName(province: string) {
  return PROVINCE_ALIASES[province] || province;
}

function normalizeDistrictName(district: string) {
  return DISTRICT_ALIASES[district] || district;
}

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeAddressOptions(payload: unknown): ProvinceOption[] {
  if (!Array.isArray(payload)) return FALLBACK_ADDRESS_OPTIONS;

  const options = payload
    .map((rawProvince) => {
      const province = rawProvince as RawProvince;
      const name = normalizeProvinceName(toText(province.name));
      const rawDistricts = Array.isArray(province.districts) ? province.districts : [];
      const districts = rawDistricts
        .map((rawDistrict) => {
          const district = rawDistrict as RawDistrict;
          const districtName = normalizeDistrictName(toText(district.name));
          const rawWards = Array.isArray(district.wards) ? district.wards : [];
          const wards = rawWards
            .map((rawWard) => toText((rawWard as RawWard).name))
            .filter(Boolean);

          return {
            name: districtName,
            wards,
          };
        })
        .filter((district) => district.name && district.wards.length > 0);

      return {
        name,
        districts,
      };
    })
    .filter((province) => province.name && province.districts.length > 0);

  return options.length > 0 ? options : FALLBACK_ADDRESS_OPTIONS;
}

export function getProvinceOptions(addressOptions: ProvinceOption[] = FALLBACK_ADDRESS_OPTIONS) {
  return addressOptions.map((province) => province.name);
}

export function getDistrictOptions(province: string, addressOptions: ProvinceOption[] = FALLBACK_ADDRESS_OPTIONS) {
  const normalized = normalizeProvinceName(province);
  return addressOptions.find((item) => item.name === normalized)?.districts.map((district) => district.name) || [];
}

export function getWardOptions(
  province: string,
  district: string,
  addressOptions: ProvinceOption[] = FALLBACK_ADDRESS_OPTIONS,
) {
  const normalized = normalizeProvinceName(province);
  const normalizedDistrict = normalizeDistrictName(district);
  const provinceOption = addressOptions.find((item) => item.name === normalized);
  return provinceOption?.districts.find((item) => item.name === normalizedDistrict)?.wards || [];
}

export function withCurrentOption(options: string[], current: string) {
  const value = current.trim();
  if (!value || options.includes(value)) return options;
  return [value, ...options];
}
