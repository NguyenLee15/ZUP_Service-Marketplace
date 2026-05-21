export interface DistrictOption {
  name: string;
  wards: string[];
}

export interface ProvinceOption {
  name: string;
  districts: DistrictOption[];
}

export const ADDRESS_OPTIONS: ProvinceOption[] = [
  {
    name: 'Hà Nội',
    districts: [
      {
        name: 'Hoàn Kiếm',
        wards: ['Hàng Bạc', 'Hàng Bài', 'Hàng Bồ', 'Hàng Gai', 'Hàng Trống', 'Tràng Tiền'],
      },
      {
        name: 'Ba Đình',
        wards: ['Cống Vị', 'Đội Cấn', 'Điện Biên', 'Giảng Võ', 'Kim Mã', 'Ngọc Hà'],
      },
      {
        name: 'Đống Đa',
        wards: ['Cát Linh', 'Láng Hạ', 'Ô Chợ Dừa', 'Quang Trung', 'Thịnh Quang', 'Trung Liệt'],
      },
      {
        name: 'Cầu Giấy',
        wards: ['Dịch Vọng', 'Dịch Vọng Hậu', 'Mai Dịch', 'Nghĩa Đô', 'Nghĩa Tân', 'Yên Hòa'],
      },
      {
        name: 'Hai Bà Trưng',
        wards: ['Bạch Đằng', 'Bách Khoa', 'Bùi Thị Xuân', 'Minh Khai', 'Thanh Lương', 'Trương Định'],
      },
      {
        name: 'Thanh Xuân',
        wards: ['Hạ Đình', 'Khương Đình', 'Khương Mai', 'Nhân Chính', 'Thanh Xuân Bắc', 'Thanh Xuân Trung'],
      },
    ],
  },
  {
    name: 'TP. Hồ Chí Minh',
    districts: [
      {
        name: 'Quận 1',
        wards: ['Bến Nghé', 'Bến Thành', 'Cầu Kho', 'Cầu Ông Lãnh', 'Đa Kao', 'Nguyễn Cư Trinh'],
      },
      {
        name: 'Quận 3',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 5', 'Phường 9', 'Võ Thị Sáu'],
      },
      {
        name: 'Quận 7',
        wards: ['Bình Thuận', 'Phú Mỹ', 'Phú Thuận', 'Tân Hưng', 'Tân Phong', 'Tân Quy'],
      },
      {
        name: 'Bình Thạnh',
        wards: ['Phường 1', 'Phường 2', 'Phường 5', 'Phường 11', 'Phường 19', 'Phường 25'],
      },
      {
        name: 'Tân Bình',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 12', 'Phường 13', 'Phường 15'],
      },
      {
        name: 'Phú Nhuận',
        wards: ['Phường 1', 'Phường 2', 'Phường 4', 'Phường 7', 'Phường 9', 'Phường 15'],
      },
      {
        name: 'Gò Vấp',
        wards: ['Phường 1', 'Phường 3', 'Phường 5', 'Phường 10', 'Phường 16', 'Phường 17'],
      },
      {
        name: 'Thủ Đức',
        wards: ['An Khánh', 'Bình Thọ', 'Hiệp Bình Chánh', 'Linh Chiểu', 'Linh Trung', 'Thảo Điền'],
      },
    ],
  },
  {
    name: 'Đà Nẵng',
    districts: [
      {
        name: 'Hải Châu',
        wards: ['Bình Hiên', 'Bình Thuận', 'Hải Châu 1', 'Hải Châu 2', 'Hòa Cường Bắc', 'Thạch Thang'],
      },
      {
        name: 'Thanh Khê',
        wards: ['An Khê', 'Chính Gián', 'Hòa Khê', 'Tam Thuận', 'Tân Chính', 'Vĩnh Trung'],
      },
      {
        name: 'Sơn Trà',
        wards: ['An Hải Bắc', 'An Hải Đông', 'An Hải Tây', 'Mân Thái', 'Nại Hiên Đông', 'Thọ Quang'],
      },
      {
        name: 'Ngũ Hành Sơn',
        wards: ['Hòa Hải', 'Hòa Quý', 'Khuê Mỹ', 'Mỹ An'],
      },
      {
        name: 'Liên Chiểu',
        wards: ['Hòa Hiệp Bắc', 'Hòa Hiệp Nam', 'Hòa Khánh Bắc', 'Hòa Khánh Nam', 'Hòa Minh'],
      },
      {
        name: 'Cẩm Lệ',
        wards: ['Hòa An', 'Hòa Phát', 'Hòa Thọ Đông', 'Hòa Thọ Tây', 'Khuê Trung'],
      },
    ],
  },
];

const PROVINCE_ALIASES: Record<string, string> = {
  'TP Hồ Chí Minh': 'TP. Hồ Chí Minh',
  'TP.Hồ Chí Minh': 'TP. Hồ Chí Minh',
  'Hồ Chí Minh': 'TP. Hồ Chí Minh',
};

function normalizeProvinceName(province: string) {
  return PROVINCE_ALIASES[province] || province;
}

export function getProvinceOptions() {
  return ADDRESS_OPTIONS.map((province) => province.name);
}

export function getDistrictOptions(province: string) {
  const normalized = normalizeProvinceName(province);
  return ADDRESS_OPTIONS.find((item) => item.name === normalized)?.districts.map((district) => district.name) || [];
}

export function getWardOptions(province: string, district: string) {
  const normalized = normalizeProvinceName(province);
  const provinceOption = ADDRESS_OPTIONS.find((item) => item.name === normalized);
  return provinceOption?.districts.find((item) => item.name === district)?.wards || [];
}

export function withCurrentOption(options: string[], current: string) {
  const value = current.trim();
  if (!value || options.includes(value)) return options;
  return [value, ...options];
}
