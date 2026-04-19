/**
 * Mock Data - Login Accounts
 * Dùng cho testing & development
 * 
 * Note: Đây là dữ liệu giả định. Trong production, dữ liệu phải được lưu trữ an toàn
 * và không được hardcode trong source code.
 */

export type UserRole = 'admin' | 'provider' | 'customer' | 'staff'

export interface MockUser {
  id: string
  email: string
  password: string
  fullName: string
  phone: string
  role: UserRole
  avatar?: string
  status: 'active' | 'inactive' | 'pending'
  createdAt: string
  lastLogin?: string
  description?: string
}

export interface MockAccount {
  user: MockUser
  accessToken: string
  refreshToken: string
  expiresIn: number
}

/**
 * Mock Users Database
 * Password: Tất cả tài khoản đều dùng password = "123456"
 */
export const MOCK_USERS: MockUser[] = [
  // 👨‍💼 ADMIN Account
  {
    id: 'admin-001',
    email: 'admin@marketplace.com',
    password: '123456',
    fullName: 'Nguyễn Văn Admin',
    phone: '0901000001',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    status: 'active',
    createdAt: '2024-01-01T10:00:00Z',
    lastLogin: '2026-04-11T15:30:00Z',
    description: 'Quản lý viên hệ thống chính',
  },

  // 🏢 PROVIDER Accounts
  {
    id: 'provider-001',
    email: 'provider@marketplace.com',
    password: '123456',
    fullName: 'Trần Văn Provider',
    phone: '0912345678',
    role: 'provider',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider1',
    status: 'active',
    createdAt: '2024-02-15T08:30:00Z',
    lastLogin: '2026-04-12T09:15:00Z',
    description: 'Nhà cung cấp dịch vụ sửa chữa điện tử',
  },

  {
    id: 'provider-002',
    email: 'hoang.builder@marketplace.com',
    password: '123456',
    fullName: 'Lê Thị Hương',
    phone: '0923456789',
    role: 'provider',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider2',
    status: 'active',
    createdAt: '2024-03-20T14:45:00Z',
    lastLogin: '2026-04-10T18:00:00Z',
    description: 'Nhà cung cấp dịch vụ vệ sinh nhà cửa',
  },

  {
    id: 'provider-003',
    email: 'ngoc.painter@marketplace.com',
    password: '123456',
    fullName: 'Phạm Ngọc Tuyền',
    phone: '0934567890',
    role: 'provider',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=provider3',
    status: 'active',
    createdAt: '2024-02-10T11:20:00Z',
    lastLogin: '2026-04-11T16:45:00Z',
    description: 'Nhà cung cấp dịch vụ sơn & decor nội thất',
  },

  // 👤 CUSTOMER Accounts
  {
    id: 'customer-001',
    email: 'customer@marketplace.com',
    password: '123456',
    fullName: 'Nguyễn Thị Lan',
    phone: '0945678901',
    role: 'customer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer1',
    status: 'active',
    createdAt: '2024-01-10T09:00:00Z',
    lastLogin: '2026-04-12T14:20:00Z',
    description: 'Khách hàng thường xuyên',
  },

  {
    id: 'customer-002',
    email: 'minh.customer@marketplace.com',
    password: '123456',
    fullName: 'Võ Minh Tuấn',
    phone: '0956789012',
    role: 'customer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer2',
    status: 'active',
    createdAt: '2024-02-20T13:15:00Z',
    lastLogin: '2026-04-09T10:30:00Z',
    description: 'Khách hàng mới',
  },

  {
    id: 'customer-003',
    email: 'linh.user@marketplace.com',
    password: '123456',
    fullName: 'Đặng Thị Linh',
    phone: '0967890123',
    role: 'customer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=customer3',
    status: 'active',
    createdAt: '2024-03-05T16:45:00Z',
    lastLogin: '2026-04-11T11:00:00Z',
    description: 'Khách hàng VIP',
  },

  // 👷 STAFF Accounts
  {
    id: 'staff-001',
    email: 'staff@marketplace.com',
    password: '123456',
    fullName: 'Vũ Văn Staff',
    phone: '0978901234',
    role: 'staff',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=staff1',
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z',
    lastLogin: '2026-04-12T08:00:00Z',
    description: 'Nhân viên hỗ trợ khách hàng',
  },

  {
    id: 'staff-002',
    email: 'tuyen.staff@marketplace.com',
    password: '123456',
    fullName: 'Bạch Thanh Tuyền',
    phone: '0989012345',
    role: 'staff',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=staff2',
    status: 'active',
    createdAt: '2024-02-01T09:30:00Z',
    lastLogin: '2026-04-11T17:45:00Z',
    description: 'Nhân viên xử lý tranh chấp',
  },

  {
    id: 'staff-003',
    email: 'kien.moderator@marketplace.com',
    password: '123456',
    fullName: 'Hoàng Kiến',
    phone: '0990123456',
    role: 'staff',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=staff3',
    status: 'active',
    createdAt: '2024-03-10T14:20:00Z',
    lastLogin: '2026-04-10T12:15:00Z',
    description: 'Nhân viên kiểm duyệt nội dung',
  },
]

/**
 * Mock Tokens (giả định)
 */
const MOCK_TOKENS = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiaWF0IjoxNzEyOTA0ODAwLCJleHAiOjE3MTI5MTE4MDB9.token',
  refreshToken: 'refresh_token_mock_value_here',
  expiresIn: 7200, // 2 hours
}

/**
 * Hàm tìm kiếm tài khoản theo email
 */
export function findUserByEmail(email: string): MockUser | undefined {
  return MOCK_USERS.find((user) => user.email.toLowerCase() === email.toLowerCase())
}

/**
 * Hàm tìm kiếm tài khoản theo role
 */
export function findUsersByRole(role: UserRole): MockUser[] {
  return MOCK_USERS.filter((user) => user.role === role)
}

/**
 * Hàm kiểm tra thông tin đăng nhập
 * @param email Email người dùng
 * @param password Mật khẩu
 * @returns Thông tin tài khoản nếu hợp lệ, null nếu sai
 */
export function validateLogin(email: string, password: string): MockUser | null {
  const user = findUserByEmail(email)
  if (user && user.password === password && user.status === 'active') {
    return user
  }
  return null
}

/**
 * Hàm tạo mock access token
 */
export function generateMockAccount(user: MockUser): MockAccount {
  return {
    user: {
      ...user,
      lastLogin: new Date().toISOString(),
    },
    accessToken: MOCK_TOKENS.accessToken,
    refreshToken: MOCK_TOKENS.refreshToken,
    expiresIn: MOCK_TOKENS.expiresIn,
  }
}

/**
 * Danh sách các tài khoản mẫu (dùng để hiển thị)
 */
export const QUICK_LOGIN_GUIDES = [
  {
    role: 'Admin' as UserRole,
    email: 'admin@marketplace.com',
    password: '123456',
    description: 'Quản lý toàn bộ hệ thống',
    capabilities: ['Quản lý người dùng', 'Quản lý dịch vụ', 'Xem báo cáo', 'Quản lý tranh chấp'],
  },
  {
    role: 'Provider' as UserRole,
    email: 'provider@marketplace.com',
    password: '123456',
    description: 'Cung cấp dịch vụ trên marketplace',
    capabilities: ['Tạo dịch vụ', 'Quản lý booking', 'Xem đánh giá', 'Quản lý ví'],
  },
  {
    role: 'Customer' as UserRole,
    email: 'customer@marketplace.com',
    password: '123456',
    description: 'Sử dụng dịch vụ từ các provider',
    capabilities: ['Tìm dịch vụ', 'Đặt booking', 'Đánh giá', 'Chat với provider'],
  },
  {
    role: 'Staff' as UserRole,
    email: 'staff@marketplace.com',
    password: '123456',
    description: 'Hỗ trợ khách hàng và xử lý vấn đề',
    capabilities: ['Hỗ trợ khách hàng', 'Xử lý tranh chấp', 'Kiểm duyệt nội dung'],
  },
]

/**
 * Export tất cả mock data
 */
export const mockData = {
  users: MOCK_USERS,
  tokens: MOCK_TOKENS,
  guides: QUICK_LOGIN_GUIDES,
  validateLogin,
  findUserByEmail,
  findUsersByRole,
  generateMockAccount,
}

export default mockData
