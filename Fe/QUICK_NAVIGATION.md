# Quick Navigation - Marketplace Dịch Vụ

## 🔐 Authentication Routes

| Trang | URL | Tính Năng |
|-------|-----|----------|
| Đăng Nhập | `/login` | Email, Password (ẩn/hiện), Nhớ MK, Quên MK |
| Đăng Ký | `/register` | 2 bước: Form + OTP 6 ô, Countdown 60s |
| Quên Mật Khẩu | `/forgot-password` | 2 bước: Email → Đặt lại MK |

---

## 🏠 Main Customer Routes

### Homepage & Discovery
| Trang | URL | Tính Năng |
|-------|-----|----------|
| Trang Chủ | `/` | Search bar AI, 8 danh mục, Slider dịch vụ hot |
| Danh Sách Dịch Vụ | `/services` | Filter (giá, rating, khoảng cách), Sort, Responsive |
| Chi Tiết Dịch Vụ | `/services/[id]` | Slider ảnh, Reviews, Sticky booking box |

### Profile & Addresses
| Trang | URL | Tính Năng |
|-------|-----|----------|
| Hồ Sơ Cá Nhân | `/profile` | Avatar upload, Form info, Đổi MK |
| Quản Lý Địa Chỉ | `/profile/addresses` | List địa chỉ, Modal thêm, Map mock |

### Bookings
| Trang | URL | Trạng Thái | Tính Năng |
|-------|-----|-----------|----------|
| Danh Sách | `/bookings` | Tất cả | Tabs lọc status, Cards booking |
| Chi Tiết | `/bookings/[id]` | **Pending** | Timeline, Alert, Nút hủy |
| | | **Quoted** | Báo giá box, 2 nút (Đồng ý/Từ chối) |
| | | **In Progress** | Timeline, Countdown 24h |
| | | **Completed** | Ảnh kết quả, Nút đánh giá, Khiếu nại |
| Đánh Giá | `/bookings/[id]/review` | - | 5 sao, Textarea, Submit |
| Khiếu Nại | `/bookings/[id]/dispute` | - | Lý do dropdown, File upload (drag-drop) |

### Chat & Support
| Trang | URL | Tính Năng |
|-------|-----|----------|
| Chat | `/chat` | Sidebar conversations, AI badge, Real-time messages |

---

## 🎯 Feature Highlights

### Search & Filters ✨
- **Homepage Search:** Full-text search + Location + AI button
- **Services Page Filters:**
  - Khoảng giá (0 - 3,000,000₫)
  - Đánh giá (0-5 sao)
  - Khoảng cách (0-10 km)
- **Sort Options:** Phổ biến, Giá thấp/cao, Đánh giá, Mới nhất

### Booking Workflow 📋
```
1. Browse Services → Search/Filter
2. Click Service → View Details → Click "Đặt Dịch Vụ"
3. Create Booking → Status: PENDING
4. Provider Accepts → Status: QUOTED
5. Customer Accepts → Status: IN_PROGRESS
6. Provider Completes → Status: COMPLETED
7. Customer Reviews/Disputes
```

### Status Colors 🎨
```
Chờ XN (Pending)      = 🟡 Yellow
Đã Báo Giá (Quoted)   = 🔵 Blue
Đang TH (In Progress) = 🟣 Purple
Hoàn Thành (Completed)= 🟢 Green
Đã Hủy (Cancelled)    = 🔴 Red
```

### Form Validations ✅
```
Login:
  - Email: valid email format
  - Password: min 6 chars

Register:
  - Full Name: min 2 chars
  - Email: valid email
  - Phone: 10-11 digits
  - Password: min 6 chars

Profile:
  - Full Name: min 2 chars
  - Phone: 10-11 digits
  - Old/New Password: min 6 chars

Address:
  - Full Name: min 2 chars
  - Phone: 10-11 digits
  - All dropdowns required
  - Address: min 5 chars

Review:
  - Rating: 1-5 stars required
  - Comment: optional, max 500 chars

Dispute:
  - Reason: required
  - Description: required, max 1000 chars
  - Files: optional, max 5 files, 10MB each
```

---

## 🎨 Design Tokens

### Colors
```
Primary:     #2563EB (Blue-600)
Success:     #16A34A (Green-600)
Warning:     #EA580C (Orange-500)
Error:       #DC2626 (Red-600)
Background:  #F9FAFB (Gray-50)
Surface:     #FFFFFF
Border:      #E5E7EB (Gray-200)
Text Dark:   #111827 (Gray-900)
Text Light:  #6B7280 (Gray-600)
```

### Spacing
```
xs: 4px   (0.25rem)
sm: 8px   (0.5rem)
md: 16px  (1rem)
lg: 24px  (1.5rem)
xl: 32px  (2rem)
2xl: 48px (3rem)
```

### Typography
```
Heading 1: text-3xl font-bold
Heading 2: text-2xl font-bold
Heading 3: text-lg font-bold
Body:      text-base
Small:     text-sm
Tiny:      text-xs
```

---

## 📱 Responsive Breakpoints

```
Mobile:   < 768px  (sm)
Tablet:   768px+   (md)
Desktop:  1024px+  (lg)
```

Key responsive features:
- Sidebar ẩn mobile → toggle menu
- Grid chuyển từ 1-col → multi-col
- Modals full-screen mobile
- Buttons full-width mobile

---

## 🔑 Key Components Used

### Shadcn/UI
- `Button` - Primary, Outline, Destructive, Ghost
- `Input` - Text inputs
- `Card` - Container component
- `Badge` - Status badges

### Lucide React Icons
```
Navigation: ChevronLeft, ChevronRight, Menu, X
User:       User, Heart, MessageSquare, Phone
Status:     Check, AlertCircle, Clock, Star
Content:    Image, FileText, Upload, Paperclip
Utils:      MapPin, Calendar, DollarSign, Info
```

### Custom Components
```
- Tabs (status filtering)
- Timeline (booking progress)
- Image Slider (service details)
- Rating Stars (5-star system)
- Countdown Timer (OTP 60s)
- File Upload (drag-drop)
- Modal (dialogs)
```

---

## 🚀 Development Tips

### Adding New Service
1. Add to `allServices` array in `/services/page.tsx`
2. Include: id, name, provider, rating, reviews, price, distance, image, category

### Adding New Booking Status
1. Update `statusConfig` in `/bookings/page.tsx`
2. Add status case in `/bookings/[id]/page.tsx`
3. Add timeline step in `BookingDetail` interface

### Customizing Colors
- All colors in Tailwind classes (e.g., `bg-blue-600`, `text-green-800`)
- Update `globals.css` for theme tokens if needed

### API Integration Points
```
POST /auth/login
POST /auth/register
POST /auth/forgot-password
GET /profile
PUT /profile
GET /addresses
POST /addresses
GET /services
GET /services/:id
GET /bookings
GET /bookings/:id
POST /bookings/:id/quote-accept
POST /bookings/:id/review
POST /bookings/:id/dispute
GET /chat
POST /chat/message
```

---

## 🧪 Testing Scenarios

### Happy Path
1. Login → Homepage → Search → View Service → Create Booking → Accept Quote → Complete → Review

### Error Scenarios
1. Invalid email format → Show error
2. Password too short → Show error
3. Missing required fields → Disable submit
4. File too large → Show error

### Edge Cases
1. 0 bookings → Show empty state
2. 0 search results → Show "no matches"
3. OTP timeout → Show resend button
4. Network error → Show retry button

---

## 📞 Support Resources

- **Docs:** See `MARKETPLACE_GUIDE.md`
- **Tech Stack:** Next.js 16, React 19, Tailwind CSS v4
- **Package Manager:** pnpm
- **Deployment:** Vercel (ready!)

---

Enjoy building! 🎉
