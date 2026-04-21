<div align="center">

# 🌾 SmartKisan AI
https://smartkisanai.vercel.app/

### AI-Powered Precision Agriculture Dashboard for Indian Farmers

![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-06B6D4?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-Auth_&_DB-3FCF8E?logo=supabase)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-Vision_&_Text-4285F4?logo=google)
![License](https://img.shields.io/badge/License-MIT-green)

**SmartKisan AI** is a full-stack, bilingual (English + Hindi) precision agriculture platform that empowers Indian farmers with AI-driven crop disease detection, real-time government scheme discovery, yield prediction, soil analytics, and personalized farm management — all from a single dashboard.

[Features](#-features) · [Tech Stack](#-tech-stack) · [Getting Started](#-getting-started) · [Architecture](#-architecture) · [API Reference](#-api-reference) · [Roadmap](#-roadmap) · [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Database Schema](#-database-schema)
- [Security](#-security)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### � Farmer Profile & Integrated Dashboard
- Supabase-authenticated user registration and login
- Full CRUD operations for crop entries (name, type, field name, field size, location, sowing date)
- Inline crop edit and delete with optimistic UI
- Persistent profile data (name, village, state) across sessions
- Profile section auto-shows and smooth-scrolls into view on login
- **Soil analytics, crop disease scanner, and yield prediction are all integrated directly inside the Farmer Profile** — no separate page sections

### 🔬 AI Crop Disease Scanner *(inside Farmer Profile)*
- Upload or capture a crop/plant photo for instant AI analysis
- Identifies crop type, health percentage, growth stage, and estimated harvest time
- Detects diseases, nutrient deficiencies, and irrigation issues
- Returns actionable recommendations in **English & Hindi**
- Rejects non-crop images with an intelligent validation layer
- Powered by **Google Gemini Vision AI** (`GEMINI_CROP_API_KEY`) with multi-model failover
- Per-API-key cooldown (4 s minimum gap) to respect quota limits

### 🧪 Soil Analytics *(inside Farmer Profile)*
- Manual sensor data entry: Moisture, Temperature, N, P, K
- **pH tracking** for optimal soil health monitoring
- Visual NPK bar charts and moisture/temperature area charts powered by **Recharts**
- Per-reading health badges (Optimal / Low / High / Hot / Cold)
- Historical sensor readings stored in Supabase, shown chronologically
- Delete individual readings with confirmation

### 📈 AI Yield Prediction *(inside Farmer Profile)*
- Select any registered crop and hit "Predict Yield"
- Uses latest sensor reading + crop metadata to call `/api/predict-yield`
- Returns predicted yield (quintal/hectare), yield range, confidence score, growth stage, impact factors, and optimization tips
- Bilingual recommendations (English + Hindi)

### 🏛️ Real Government Schemes (Live)
- Fetches **real, currently active** Indian government agricultural schemes via Gemini AI
- 10-minute server-side in-memory cache to reduce API calls
- Graceful fallback to cached or hardcoded schemes if rate-limited or API is down
- Displays official `.gov.in` website links for each scheme
- State-specific scheme filtering
- Shows scheme categories, financial benefits, and eligibility
- Direct "Apply Online" and "Official Website" buttons
- Bilingual display (English + Hindi)

### 📊 Dynamic Farm Dashboard
- Personalized "My Farm Overview" — empty state until crops are added
- Crop selection UI when multiple crops are registered
- Auto-calculated growth progress from sowing date (stage, % complete, days to harvest) based on a 120-day crop cycle
- Static weather overview panel and farm activity tracker
- Fully driven by Supabase data — no hardcoded farm values

### 🔐 Security Hardened
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`
- Per-IP in-memory rate limiting on all API routes (5–10 req/min per endpoint)
- Input validation and sanitization on all endpoints (state param stripped of special chars, image size capped)
- Base64 image size limit (max ~15 MB)
- API responses marked `no-store` to prevent caching of sensitive data
- Supabase client has graceful degradation proxy — app builds cleanly without env vars set

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1 (App Router) |
| **Language** | TypeScript 5.7 |
| **UI Library** | React 19.2 |
| **Styling** | Tailwind CSS 4.2 + Radix UI Primitives |
| **AI / ML** | Google Gemini API (Vision + Text) — multi-model failover |
| **Auth & Database** | Supabase (Auth + PostgreSQL) |
| **Charts** | Recharts 2.15 |
| **Forms** | React Hook Form + Zod validation |
| **Icons** | Lucide React |
| **Fonts** | Inter + Noto Sans Devanagari (Hindi) |
| **Analytics** | Vercel Analytics |
| **Package Manager** | pnpm |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                     │
│  ┌────────┐  ┌──────────┐  ┌──────────────────────────────┐ │
│  │ Navbar │  │   Hero   │  │       Farmer Profile         │ │
│  │        │  │ Section  │  │  ┌──────────┐ ┌───────────┐  │ │
│  └────────┘  └──────────┘  │  │   Crop   │ │   Soil    │  │ │
│                             │  │ Scanner  │ │ Analytics │  │ │
│                             │  └──────────┘ └───────────┘  │ │
│                             │  ┌──────────────────────────┐ │ │
│                             │  │    Yield Prediction      │ │ │
│                             │  └──────────────────────────┘ │ │
│                             └──────────────────────────────┘ │
│  ┌─────────────────────┐  ┌────────────────────────────────┐ │
│  │    Farm Dashboard   │  │      Gov Schemes               │ │
│  └─────────────────────┘  └────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼──────────────────────────────┐
│                     Next.js API Routes                      │
│  ┌────────────────┐  ┌────────────────┐  ┌───────────────┐  │
│  │ /api/analyze-  │  │ /api/predict-  │  │ /api/gov-     │  │
│  │  crop (POST)   │  │  yield (POST)  │  │ schemes (GET) │  │
│  │ GEMINI_CROP_   │  │  GEMINI_API_   │  │ GEMINI_API_   │  │
│  │   API_KEY      │  │     KEY        │  │    KEY        │  │
│  │  10 req/min    │  │  10 req/min    │  │  5 req/min    │  │
│  │  + per-key     │  │                │  │  + 10 min     │  │
│  │   cooldown     │  │                │  │   cache       │  │
│  └───────┬────────┘  └───────┬────────┘  └──────┬────────┘  │
└──────────┼───────────────────┼──────────────────┼───────────┘
           │                   │                  │
┌──────────▼───────────────────▼──────────────────▼───────────┐
│               Google Gemini AI (Multi-Model Failover)       │
│  analyze-crop:   gemini-2.5-flash-lite → 2.5-flash →        │
│                  2.0-flash-lite                              │
│  predict-yield:  gemini-2.5-flash-lite → 2.0-flash-lite →   │
│                  2.5-flash → 2.0-flash                       │
│  gov-schemes:    gemini-2.5-flash-lite → 2.5-flash          │
│  (Automatic failover + exponential backoff)                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     Supabase (Backend)                      │
│  ┌──────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │   Auth   │  │ farmers_profile  │  │  crops /          │  │
│  │  (Email) │  │    (users)       │  │  sensor_data      │  │
│  └──────────┘  └─────────────────┘  └───────────────────┘  │
│  (Graceful degradation proxy when env vars are missing)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **pnpm** ≥ 8.x (`npm install -g pnpm`)
- **Supabase** project (free tier works)
- **Google Gemini API Key(s)** ([Get one here](https://aistudio.google.com/apikey))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/smartkisan-ai.git
cd smartkisan-ai

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Then edit .env.local with your actual keys (see below)

# 4. Run the development server
pnpm dev
```

The app will be running at **http://localhost:3000**.

### Build for Production

```bash
pnpm build
pnpm start
```

---

## 🔑 Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key
GEMINI_CROP_API_KEY=your-gemini-crop-api-key
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `GEMINI_API_KEY` | ✅ | Gemini API key for yield prediction and gov schemes (server-side only) |
| `GEMINI_CROP_API_KEY` | ✅ | Dedicated Gemini API key for crop disease scanner — keeps quotas isolated |

> **Note:** Neither `GEMINI_API_KEY` nor `GEMINI_CROP_API_KEY` is ever exposed to the client. All AI calls are routed through server-side API routes.

---

## 📁 Project Structure

```
smartkisan-ai/
├── app/
│   ├── layout.tsx                  # Root layout (fonts, metadata, Vercel Analytics)
│   ├── page.tsx                    # Main page — Navbar, Hero, Profile, Dashboard, Schemes
│   ├── globals.css                 # Global styles
│   └── api/
│       ├── analyze-crop/
│       │   └── route.ts            # POST — Gemini Vision crop disease analysis
│       ├── predict-yield/
│       │   └── route.ts            # POST — AI yield prediction
│       └── gov-schemes/
│           └── route.ts            # GET  — Real govt scheme fetcher (cached)
│
├── components/
│   ├── smart-kisan/
│   │   ├── navbar.tsx              # Sticky nav + auth modal (login / register)
│   │   ├── hero-section.tsx        # Landing hero with background image + CTA buttons
│   │   ├── farmer-profile.tsx      # Profile + crop CRUD + soil analytics +
│   │   │                           #   crop scanner + yield prediction (all-in-one)
│   │   ├── crop-disease-scanner.tsx# AI image scanner component (used inside profile)
│   │   ├── crop-image-analyzer.tsx # Analysis result display sub-component
│   │   ├── farmer-dashboard.tsx    # Dynamic farm overview (Supabase-driven, growth calc)
│   │   ├── soil-analytics.tsx      # Standalone soil analytics component (reusable)
│   │   ├── gov-schemes.tsx         # Live government schemes with cache + fallback
│   │   └── footer.tsx              # Site footer
│   ├── ui/                         # Radix UI + shadcn/ui primitives (40+ components)
│   └── theme-provider.tsx          # Dark/light theme context
│
├── hooks/
│   ├── use-mobile.ts               # Mobile breakpoint detection
│   └── use-toast.ts                # Toast notification hook
│
├── lib/
│   ├── supabase.ts                 # Supabase client singleton with graceful degradation
│   └── utils.ts                    # Utility functions (cn, etc.)
│
├── public/
│   └── images/                     # Static assets (hero-farm.jpg, icons)
│
├── styles/
│   └── globals.css                 # Additional global styles
│
├── next.config.mjs                 # Next.js config + security headers
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies and scripts
└── pnpm-lock.yaml                  # Lockfile
```

---

## 📡 API Reference

### `POST /api/analyze-crop`

Analyze a crop image using Gemini Vision AI. Uses `GEMINI_CROP_API_KEY` with a 4-second per-key cooldown and multi-model failover.

**Rate limit:** 10 requests / minute per IP

**Request Body:**
```json
{
  "image": "base64-encoded-image-string"
}
```

**Response (200):**
```json
{
  "analysis": {
    "crop_name": "Wheat",
    "crop_name_hi": "गेहूं",
    "health": {
      "percentage": 82,
      "status": "Healthy",
      "status_hi": "स्वस्थ",
      "summary": "The wheat crop appears healthy...",
      "summary_hi": "...",
      "issues": [],
      "issues_hi": []
    },
    "nutrition": {
      "summary": "...",
      "summary_hi": "...",
      "deficiencies": [],
      "sufficient": [],
      "sufficient_hi": []
    },
    "irrigation": {
      "status": "Adequate",
      "status_hi": "पर्याप्त",
      "percentage": 75,
      "recommendation": "...",
      "recommendation_hi": "..."
    },
    "harvest": {
      "estimated_time": "3-4 weeks",
      "estimated_time_hi": "3-4 सप्ताह",
      "growth_stage": "Grain Filling",
      "growth_stage_hi": "दाना भरना",
      "recommendation": "..."
    },
    "additional_tips": [...],
    "additional_tips_hi": [...]
  }
}
```

**Error Responses:** `400` (invalid image / not a crop / image too large), `429` (rate limited), `500` (server error)

---

### `POST /api/predict-yield`

Predict crop yield based on field data and sensor readings.

**Rate limit:** 10 requests / minute per IP

**Request Body:**
```json
{
  "crop_name": "Rice",
  "crop_type": "Basmati",
  "field_size": "2 acres",
  "location": "Punjab",
  "sowing_date": "2025-06-15",
  "sensor": {
    "moisture": 65,
    "temperature": 32,
    "nitrogen": 120,
    "phosphorus": 40,
    "potassium": 60
  }
}
```

**Response (200):**
```json
{
  "prediction": {
    "predicted_yield": 45.2,
    "yield_range": { "min": 40, "max": 50 },
    "confidence": 78,
    "growth_stage": "Flowering",
    "factors": [
      { "factor": "Soil Moisture", "impact": "Positive", "detail": "..." }
    ],
    "recommendation": "...",
    "recommendation_hindi": "..."
  }
}
```

---

### `GET /api/gov-schemes?state=Maharashtra`

Fetch real, currently active government schemes for Indian farmers. Results are cached server-side for 10 minutes. Falls back to cached data or hardcoded schemes if the API is unavailable.

**Rate limit:** 5 requests / minute per IP (stale cache served when limited)

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `state` | string | `India` | Target state for state-specific schemes (sanitized to letters/spaces only) |

**Response (200):**
```json
{
  "schemes": [
    {
      "name": "PM-KISAN Samman Nidhi",
      "name_hi": "पीएम-किसान सम्मान निधि",
      "description": "...",
      "description_hi": "...",
      "benefit": "₹6,000/year in 3 installments",
      "category": "Income Support",
      "category_hi": "आय सहायता",
      "status": "Active",
      "website": "https://pmkisan.gov.in",
      "apply_url": "https://pmkisan.gov.in/registrationform.aspx"
    }
  ]
}
```

---

## 🗃️ Database Schema

### Supabase Tables

#### `farmers_profile`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Profile ID |
| `user_id` | uuid (FK → auth.users) | Supabase auth user reference |
| `name` | text | Farmer's full name |
| `village` | text | Village name (optional — add column if used) |
| `state` | text | State |
| `created_at` | timestamptz | Record creation timestamp |

#### `crops`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Crop entry ID |
| `farmer_id` | uuid (FK → farmers_profile) | Owner farmer |
| `crop_name` | text | Name of the crop |
| `crop_type` | text | Variety / type |
| `field_name` | text | Field identifier (e.g., "Field A") |
| `field_size` | text | Field size (e.g., "2.5 acres") |
| `location` | text | Field location |
| `sowing_date` | date | Date of sowing |
| `created_at` | timestamptz | Record creation timestamp |

#### `sensor_data`
| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid (PK) | Reading ID |
| `farmer_id` | uuid (FK → farmers_profile) | Owner farmer |
| `moisture` | float | Soil moisture (%) |
| `temperature` | float | Soil temperature (°C) |
| `nitrogen` | float | Nitrogen level (kg/ha) |
| `phosphorus` | float | Phosphorus level (kg/ha) |
| `potassium` | float | Potassium level (kg/ha) |
| `created_at` | timestamptz | Reading timestamp |

> **Tip:** Enable Row-Level Security (RLS) on all three tables so farmers can only read/write their own data.

---

## 🔐 Security

| Measure | Implementation |
|---------|---------------|
| **Security Headers** | `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy` in `next.config.mjs` |
| **Rate Limiting** | In-memory per-IP rate limiter — 10 req/min (crop scanner, yield), 5 req/min (gov-schemes) |
| **Input Validation** | Type checking, size limits, and sanitization on all API inputs; state param stripped to `[a-zA-Z\s-]` only |
| **Image Size Limit** | Base64 payload capped at ~20 MB raw (~15 MB image) |
| **API Key Protection** | `GEMINI_API_KEY` and `GEMINI_CROP_API_KEY` are server-side only — never sent to the client |
| **Isolated API Keys** | Separate Gemini key for crop scanner keeps Vision quota independent from text-model quota |
| **Per-Key Cooldown** | 4-second minimum gap between Gemini calls in `analyze-crop` to respect rate limits |
| **Auth** | Supabase Auth with Row-Level Security (RLS) on database tables |
| **Cache Control** | All API responses return `Cache-Control: no-store` |
| **Camera Permissions** | `Permissions-Policy: camera=(self)` — camera access restricted to same origin |
| **Geolocation** | `Permissions-Policy: geolocation=(self)` — geolocation restricted to same origin |
| **Build Safety** | Supabase client uses a graceful degradation Proxy when env vars are absent (prevents build failures) |

---

## 🧪 Testing & Quality Assurance

### Test Suite Overview

**SmartKisan** includes a comprehensive testing framework with **139 unit tests** covering critical functionality:

| Test Category | Count | Coverage | Status |
|--------------|-------|----------|--------|
| **Input Validation** | 40+ | 94% | ✅ PASS |
| **Data Formatting** | 40+ | 97% | ✅ PASS |
| **Disease Detection** | 25+ | N/A | ✅ PASS |
| **Yield Prediction** | 35+ | N/A | ✅ PASS |
| **Total** | **139** | **70%+** | ✅ ALL PASS |

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (auto-rerun on file changes)
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Run specific test file
pnpm test validation.test.ts
```

### Test Execution Results

```
✅ Test Suites: 4 passed, 4 total
✅ Tests: 139 passed, 139 total  
✅ Snapshots: 0 total
✅ Time: ~2-7 seconds
✅ Coverage: validation.ts (94%), formatting.ts (97%)
```

### What's Tested

1. **Input Validation** (`lib/validation.ts`)
   - Crop name validation (required, max 100 chars)
   - Base64 image validation (max 20MB)
   - Sensor data validation (moisture, temperature, NPK ranges)
   - Field size validation (0-10000 hectares)
   - Location validation
   - Comprehensive yield prediction input validation

2. **Data Formatting** (`lib/formatting.ts`)
   - Yield, temperature, moisture, NPK formatting
   - Confidence score calculation
   - Days-to-harvest calculation
   - JSON response parsing with error handling
   - Text sanitization

3. **API Integration**
   - Crop disease detection response parsing
   - Severity classification
   - Treatment recommendations
   - Yield prediction logic

4. **Edge Cases & Error Handling**
   - Invalid inputs and boundary values
   - Missing or malformed data
   - Rate limiting
   - Error message extraction

---

## 📚 Documentation

### Comprehensive Guides Available

- **[DOCUMENTATION.md](./DOCUMENTATION.md)** — Complete system documentation
  - Project overview and setup
  - API endpoint documentation with examples
  - Feature descriptions
  - Deployment instructions
  - Troubleshooting guide

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — System architecture and design
  - Architecture diagrams and data flows
  - Design patterns implementation
  - Component structure
  - Database schema
  - Performance considerations
  - Security architecture

- **[SECURITY.md](./SECURITY.md)** — Security implementation guide
  - ✅ Input validation (40+ tests, 94% coverage)
  - ✅ Rate limiting (10 req/min per IP)
  - 📋 Authentication setup guide (Supabase)
  - 📋 Authorization/RBAC implementation
  - 📋 Security headers configuration
  - 📋 CORS setup
  - 📋 SQL injection prevention
  - 📋 XSS prevention
  - Complete security checklist

---

## 📊 Code Quality Metrics

| Metric | Value | Status |
|--------|-------|--------|
| **Unit Tests** | 139 passing | ✅ |
| **Code Coverage** | 70%+ | ✅ |
| **Type Coverage** | 100% | ✅ |
| **TypeScript Mode** | Strict | ✅ |
| **Security Score** | 76/100 | ⚠️ |
| **Documentation** | Comprehensive | ✅ |

---

## 🔐 Security

| Measure | Implementation | Status |
|---------|---------------|--------|
| **Input Validation** | 7 validation functions with 40+ tests | ✅ |
| **Rate Limiting** | 10 req/min per IP | ✅ |
| **Security Headers** | CSP, X-Frame-Options, X-XSS-Protection, etc. | ✅ |
| **Error Handling** | No sensitive data exposure | ✅ |
| **Authentication** | Supabase Auth (recommended) | 📋 |
| **Authorization** | RBAC implementation guide available | 📋 |
| **CORS** | Configuration guide available | 📋 |
| **SQL Injection Prevention** | RLS recommended | 📋 |

**See [SECURITY.md](./SECURITY.md) for complete implementation guide.**

---



### ✅ Phase 1 — Core Platform (Completed)
- [x] Landing page with bilingual hero section and background farm image
- [x] Supabase authentication (signup / login / logout) with auth modals in navbar
- [x] Farmer profile management with crop CRUD (add, edit, delete)
- [x] Soil analytics dashboard with NPK + moisture + temperature + pH charts
- [x] Weather overview panel
- [x] Farm activity tracker
- [x] Responsive design with mobile navigation
- [x] Dark / light theme support

### ✅ Phase 2 — AI Integration (Completed)
- [x] Gemini Vision AI crop disease scanner (embedded in Farmer Profile)
- [x] Non-crop image rejection with intelligent validation
- [x] AI-powered yield prediction engine (embedded in Farmer Profile)
- [x] Real government schemes via Gemini (live `.gov.in` links)
- [x] Multi-model failover across Gemini 2.0/2.5 models with exponential backoff
- [x] Bilingual AI responses (English + Hindi)

### ✅ Phase 3 — Security & Reliability (Completed)
- [x] Security headers (XSS, clickjacking, MIME sniffing, referrer policy)
- [x] Per-IP rate limiting on all API endpoints
- [x] Input validation and sanitization
- [x] Base64 image size limits
- [x] API response cache control (`no-store`)
- [x] Separate Gemini API key for crop scanner (quota isolation)
- [x] Per-key cooldown to respect Gemini rate limits
- [x] Supabase graceful degradation proxy for build-time safety

### ✅ Phase 4 — Enhanced Personalization (Completed)
- [x] Dynamic farm dashboard (empty until crops added)
- [x] Crop selector for multi-crop farms
- [x] Auto-calculated growth progress from sowing date (120-day cycle, 6 growth stages)
- [x] Soil analytics, crop scanner, and yield prediction consolidated inside Farmer Profile
- [x] Gov-schemes in-memory cache (10 min TTL) with stale-cache fallback
- [x] Hardcoded fallback schemes if Gemini is fully unavailable

### 📋 Phase 5 — Market & Financial Intelligence (Planned)
- [ ] Live mandi (market) prices integration via [data.gov.in](https://data.gov.in) APIs
- [ ] Crop price trend charts and forecasts
- [ ] Profit/loss calculator per crop cycle
- [ ] MSP (Minimum Support Price) tracker
- [ ] Nearby mandi locator with distance and prices
- [ ] Sell crop feature connecting farmers to buyers

### 📋 Phase 6 — IoT & Automation (Planned)
- [ ] Real-time IoT sensor data integration (soil moisture, temperature, NPK)
- [ ] Automated irrigation scheduling based on sensor + weather data
- [ ] Sensor data history with trend analysis
- [ ] Alert system for critical soil conditions
- [ ] Integration with popular IoT boards (ESP32, Arduino, Raspberry Pi)

### 📋 Phase 7 — Community & Scale (Planned)
- [ ] Multi-language support beyond Hindi (Marathi, Tamil, Telugu, Punjabi)
- [ ] Push notifications for irrigation / fertilizer reminders
- [ ] Farmer-to-farmer community forum
- [ ] Expert agronomist chat / consultation
- [ ] Regional crop calendar recommendations
- [ ] Offline mode with PWA support
- [ ] SMS-based alerts for low-connectivity areas
- [ ] Android / iOS mobile app (React Native)

### 📋 Phase 8 — Enterprise & B2B (Future)
- [ ] FPO (Farmer Producer Organization) dashboard
- [ ] Bulk crop analytics for agri-businesses
- [ ] Supply chain tracking
- [ ] Credit scoring and loan facilitation
- [ ] Government integration for scheme enrollment tracking
- [ ] Multi-tenant architecture for white-label deployment

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'feat: add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style and project structure
- Use TypeScript strict mode
- Write bilingual UI text (English + Hindi) for all user-facing strings
- All API routes must include rate limiting and input validation
- Test on both desktop and mobile viewports
- Keep dependencies minimal — don't add libraries for one-time operations

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

```
feat:     New feature
fix:      Bug fix
docs:     Documentation only
style:    Formatting, no code change
refactor: Code restructure, no feature change
perf:     Performance improvement
test:     Adding tests
chore:    Build, CI, tooling changes
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ for Indian Farmers | भारतीय किसानों के लिए बनाया गया**

[⬆ Back to Top](#-smartkisan-ai)

</div>
