# Setup & Deployment Guide - Marketplace Dịch Vụ

Complete guide to get the marketplace running locally, customizing it, and deploying to production.

---

## 🚀 Quick Start (2 minutes)

### 1. Clone or Download
```bash
# If using git
git clone <your-repo-url>
cd v0-project

# Or download the ZIP file and extract it
```

### 2. Install Dependencies
```bash
npm install
# or
pnpm install
```

### 3. Run Development Server
```bash
npm run dev
# or
pnpm dev
```

### 4. Open in Browser
```
http://localhost:3000
```

You should see the **Landing Page** with navigation to all sections.

---

## 📂 Project Structure

```
v0-project/
├── app/
│   ├── layout.tsx                   # Root layout with fonts & metadata
│   ├── page.tsx                     # Landing page with navigation
│   ├── (auth)/                      # Auth routes (nested group)
│   │   └── login/, register/, forgot-password/
│   ├── (main)/                      # Customer routes (nested group)
│   │   ├── layout.tsx               # Customer layout (without sidebar)
│   │   ├── page.tsx                 # Marketplace homepage
│   │   ├── profile/, services/, bookings/, chat/
│   │   └── ...
│   └── (provider)/                  # Provider routes (nested group)
│       ├── layout.tsx               # Provider layout (with sidebar)
│       ├── page.tsx                 # Provider dashboard
│       ├── services/, wallet/, kyc/, bookings/, chat/
│       └── ...
├── components/
│   └── ui/                          # Shadcn UI components (auto-installed)
├── lib/
│   └── utils.ts                     # Tailwind cn() utility
├── public/                          # Static files
├── package.json                     # Dependencies
├── tsconfig.json                    # TypeScript config
├── tailwind.config.ts               # Tailwind CSS config
├── next.config.mjs                  # Next.js config
├── globals.css                      # Global styles
└── Documentation files (see below)
```

---

## 🔧 Configuration

### TypeScript
All code is **100% TypeScript** with strict mode enabled. Check `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### Tailwind CSS
Configuration is in `tailwind.config.ts` (v4 - no separate config file):
```typescript
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
}
```

### Next.js
Configuration in `next.config.mjs`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {}
export default nextConfig
```

---

## 🎨 Customization

### 1. Change Colors

**Option A: Update Tailwind Classes (Quick)**
```bash
# Find & replace in all files:
#2563EB → Your primary color
#16A34A → Your success color
#EA580C → Your warning color
#DC2626 → Your error color
```

**Option B: Create Color Tokens (Best Practice)**
Edit `globals.css`:
```css
@import 'tailwindcss';

@theme inline {
  --color-primary: #2563EB;
  --color-success: #16A34A;
  --color-warning: #EA580C;
  --color-error: #DC2626;
}
```

Then use in components:
```jsx
<div className="bg-primary text-white">...</div>
```

### 2. Change Branding Text

**Landing Page** (`app/page.tsx`):
```typescript
const brandName = "Marketplace Dịch Vụ"      // Change this
const companyTagline = "Kết nối Dịch Vụ..."  // Change this
```

**Provider Sidebar** (`app/(provider)/layout.tsx`):
```typescript
<Link href="/provider" className="font-bold text-lg text-blue-600">
  DV Pro  {/* Change this to your brand */}
</Link>
```

### 3. Change Mock Data

**Services** (`app/(main)/services/page.tsx`):
```typescript
const mockServices: Service[] = [
  {
    id: '1',
    name: 'Your Service Name',
    category: 'Your Category',
    price: '1.000.000 đ',
    // ...
  }
];
```

**Bookings** (`app/(provider)/bookings/page.tsx`):
```typescript
const bookings: Booking[] = [
  {
    id: 'BK-12348',
    customerName: 'Your Customer',
    // ...
  }
];
```

Update all pages with your own mock data.

### 4. Change Fonts

**Option A: Use Google Fonts** (in `app/layout.tsx`):
```typescript
import { Poppins, Inter } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html className={`${poppins.className} ${inter.className}`}>
      {children}
    </html>
  )
}
```

**Option B: Update globals.css**:
```css
@import 'tailwindcss';

@theme inline {
  --font-sans: 'Poppins', system-ui;
  --font-mono: 'Courier New', monospace;
}
```

### 5. Change Metadata

Edit `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: 'Your Marketplace Name',
  description: 'Your marketplace description',
  // Add more metadata
}
```

---

## 🧪 Testing Locally

### Test Customer Flow
1. Go to `http://localhost:3000`
2. Click "Khách Hàng" 
3. Navigate: Services → Detail → Book → Chat
4. Try filters, search, modals

### Test Provider Flow
1. Go to `http://localhost:3000`
2. Click "Nhà Cung Cấp"
3. Explore: Dashboard → Services → Wallet → Bookings
4. Test form submissions & status changes

### Test Responsive Design
- Open DevTools (`F12`)
- Toggle device toolbar (mobile/tablet/desktop)
- Test all pages in different viewports

### Test Form Validation
- Try submitting forms with empty fields
- Try invalid inputs (e.g., email without @)
- Check error messages appear

---

## 🔗 Integration Guide

### Connect to Backend API

**Step 1: Replace Mock Data**
```typescript
// Before (mock)
const mockServices = [...]

// After (API)
import useSWR from 'swr'

export default function Services() {
  const { data, error } = useSWR('/api/services', fetcher)
  const services = data || []
  // ...
}
```

**Step 2: Create API Routes**
```bash
app/api/
├── services/
│   ├── route.ts          # GET /api/services
│   └── [id]/route.ts     # GET /api/services/[id]
├── bookings/
│   ├── route.ts
│   └── [id]/route.ts
├── chat/route.ts
└── wallet/route.ts
```

**Step 3: Create API Route Handler**
```typescript
// app/api/services/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Fetch from your database
    const services = await db.services.findAll()
    return NextResponse.json(services)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
```

### Connect to Database

**Example with Supabase:**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// In your API route
const { data, error } = await supabase
  .from('services')
  .select('*')
```

### Add Authentication

**Step 1: Choose Auth Provider**
- Supabase Auth (recommended for Postgres)
- Auth.js (works with any backend)
- Clerk (managed service)

**Step 2: Add Middleware**
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')
  if (!token && request.nextUrl.pathname.startsWith('/main')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/main/:path*', '/provider/:path*']
}
```

---

## 🚢 Deployment

### Option 1: Deploy to Vercel (Recommended)

**Step 1: Push to GitHub**
```bash
git add .
git commit -m "Initial marketplace setup"
git push origin main
```

**Step 2: Deploy on Vercel**
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "New Project"
4. Select your repository
5. Click "Deploy"

**Step 3: Add Environment Variables**
In Vercel dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
DATABASE_URL=your_database_url
```

### Option 2: Deploy to Netlify

**Step 1: Connect Repository**
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Select GitHub & your repo

**Step 2: Build Settings**
```
Build command: npm run build
Publish directory: .next
```

**Step 3: Add Environment Variables**
Netlify → Site settings → Build & deploy → Environment

### Option 3: Deploy to Self-Hosted Server

**Step 1: Build Project**
```bash
npm run build
```

**Step 2: Start Server**
```bash
npm start
# Server runs on http://localhost:3000
```

**Step 3: Use PM2 for Persistence** (Linux/Mac)
```bash
npm install -g pm2
pm2 start npm --name "marketplace" -- start
pm2 save
pm2 startup
```

---

## 🔒 Security Checklist

Before deploying to production:

- [ ] Remove all `console.log()` debug statements
- [ ] Add authentication middleware
- [ ] Validate all form inputs on backend
- [ ] Use HTTPS only
- [ ] Add CORS headers if needed
- [ ] Sanitize user input (XSS protection)
- [ ] Rate limit API endpoints
- [ ] Use environment variables for secrets
- [ ] Add Content Security Policy headers
- [ ] Enable CSRF protection
- [ ] Hash passwords (bcrypt)
- [ ] Secure cookies (HttpOnly, Secure, SameSite)
- [ ] Add error logging service (Sentry)
- [ ] Monitor performance (Vercel Analytics)

---

## 🐛 Troubleshooting

### Issue: Port 3000 already in use
```bash
# Kill the process
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

### Issue: TypeScript errors
```bash
# Check TypeScript
npx tsc --noEmit

# Fix errors in the reported files
```

### Issue: Tailwind styles not loading
```bash
# Rebuild Tailwind cache
rm -rf .next
npm run dev
```

### Issue: Module not found
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Issue: Images not loading
- Check image paths are absolute (e.g., `/images/logo.png`)
- For external URLs, add domain to `next.config.mjs`:
```javascript
const nextConfig = {
  images: {
    domains: ['example.com']
  }
}
```

---

## 📊 Performance Optimization

### 1. Image Optimization
```typescript
import Image from 'next/image'

// Good
<Image src="/logo.png" alt="Logo" width={200} height={100} />

// Avoid
<img src="/logo.png" alt="Logo" />
```

### 2. Code Splitting
```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./heavy'), {
  loading: () => <p>Loading...</p>,
})
```

### 3. Minimize Re-renders
```typescript
// Use useCallback for stable functions
const handleSubmit = useCallback((data) => {
  // Handle submit
}, [dependencies])
```

### 4. Optimize Fonts
```typescript
import { Poppins } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap', // Avoid layout shift
})
```

---

## 📈 Monitoring & Analytics

### Add Vercel Analytics
```bash
npm install @vercel/analytics @vercel/web-vitals
```

In `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Add Error Tracking (Sentry)
```bash
npm install @sentry/nextjs
```

Configure in `next.config.mjs`:
```javascript
import * as Sentry from "@sentry/nextjs"

const nextConfig = {}

export default Sentry.withSentryConfig(nextConfig, {
  org: "your-org",
  project: "your-project",
})
```

---

## 🚀 Performance Budget

Target metrics for production:

| Metric | Target |
|--------|--------|
| **First Contentful Paint** | < 1.5s |
| **Largest Contentful Paint** | < 2.5s |
| **Cumulative Layout Shift** | < 0.1 |
| **Time to Interactive** | < 3.5s |
| **Page Size** | < 100KB (gzipped) |

Monitor with:
- Google PageSpeed Insights
- WebPageTest
- Vercel Analytics

---

## 📝 Environment Variables Template

Create `.env.local`:
```
# Public (accessible in browser)
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Private (server-only)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key

# Third-party services
NEXT_PUBLIC_STRIPE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Email
SENDGRID_API_KEY=...

# File storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

---

## ✅ Pre-Launch Checklist

- [ ] All pages load without errors
- [ ] Forms submit successfully
- [ ] Responsive design tested on mobile
- [ ] All links work correctly
- [ ] No console errors
- [ ] Images load properly
- [ ] Metadata updated (title, description)
- [ ] Favicons set
- [ ] Analytics configured
- [ ] Error tracking enabled
- [ ] Security headers added
- [ ] Environment variables set
- [ ] API integration complete
- [ ] Database connection working
- [ ] Authentication system tested
- [ ] Email notifications tested
- [ ] Payment system tested
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Final QA approved

---

## 📞 Support & Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn/UI Docs](https://ui.shadcn.com)
- [React Hook Form](https://react-hook-form.com)
- [Zod Validation](https://zod.dev)

### Tools
- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub](https://github.com)
- [PostmanAPI](https://www.postman.com)

---

## 🎓 Next Steps

1. **Customize Mock Data** - Replace with your own
2. **Add Authentication** - Implement login/signup
3. **Connect Database** - Add real data persistence
4. **Integrate Payments** - Add Stripe/VNPay
5. **Set Up Email** - Add notifications
6. **Deploy** - Go live on Vercel/Netlify
7. **Monitor** - Add analytics & error tracking
8. **Iterate** - Gather feedback & improve

---

**Build Date:** 2024-06-15
**Version:** 1.0.0
**Status:** Ready for Customization & Deployment

Happy deploying! 🚀
