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

### 🔬 AI Crop Disease Scanner
- Upload or capture a crop/plant photo for instant AI analysis
- Identifies crop type, health percentage, growth stage, and estimated harvest time
- Detects diseases, nutrient deficiencies, and irrigation issues
- Returns actionable recommendations in **English & Hindi**
- Rejects non-crop images with an intelligent validation layer
- Powered by **Google Gemini Vision AI** with multi-model failover

### 🏛️ Real Government Schemes (Live)
- Fetches **real, currently active** Indian government agricultural schemes via Gemini AI
- Displays official `.gov.in` website links for each scheme
- Supports state-specific scheme filtering
- Shows scheme categories, financial benefits, and eligibility
- Direct "Apply Online" and "Official Website" buttons
- Bilingual display (English + Hindi)

### 📊 Dynamic Farm Dashboard
- Personalized "My Farm Overview" — empty until the farmer adds their crops
- Crop selection UI when multiple crops are registered
- Auto-calculated growth progress from sowing date (stage, % complete, days to harvest)
- Weather overview and farm activity tracker
- Fully driven by Supabase data — no hardcoded values

### 👤 Farmer Profile & Crop Management
- Supabase-authenticated user registration and login
- Full CRUD operations for crop entries (name, type, field name, field size, location, sowing date)
- Persistent profile data across sessions

### 🧪 Soil Analytics
- Visual soil health dashboard with NPK (Nitrogen, Phosphorus, Potassium) levels
- Moisture and temperature monitoring
- Interactive charts powered by **Recharts**

### 📈 AI Yield Prediction
- Predict expected yield (quintal/hectare) based on crop data and sensor readings
- Returns confidence score, growth stage, impact factors, and optimization tips
- Bilingual recommendations (English + Hindi)

### 🔐 Security Hardened
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy`
- Per-IP in-memory rate limiting on all API routes
- Input validation and sanitization on all endpoints
- Base64 image size limits (max 15 MB)
- API responses marked `no-store` to prevent caching of sensitive data

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16.1 (App Router, Turbopack) |
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
┌─────────────────────────────────────────────────────────┐
│                      Client (Browser)                   │
│  ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │ Navbar │ │   Hero   │ │  Crop    │ │   Farm       │ │
│  │        │ │ Section  │ │ Scanner  │ │  Dashboard   │ │
│  └────────┘ └──────────┘ └──────────┘ └──────────────┘ │
│  ┌────────────────┐ ┌────────────┐ ┌─────────────────┐ │
│  │ Farmer Profile │ │ Gov Schemes│ │  Soil Analytics │ │
│  └────────────────┘ └────────────┘ └─────────────────┘ │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│                  Next.js API Routes                     │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────┐ │
│  │ /api/analyze- │ │ /api/predict-│ │ /api/gov-       │ │
│  │ crop (POST)  │ │ yield (POST) │ │ schemes (GET)   │ │
│  └──────┬───────┘ └──────┬───────┘ └───────┬─────────┘ │
│         │ Rate Limiter   │ Rate Limiter     │ Rate Limit│
└─────────┼────────────────┼─────────────────┼───────────┘
          │                │                 │
┌─────────▼────────────────▼─────────────────▼───────────┐
│              Google Gemini AI (Multi-Model)             │
│  gemini-2.5-flash-lite → 2.0-flash-lite →              │
│  gemini-2.5-flash → gemini-2.0-flash                   │
│  (Automatic failover + exponential backoff)             │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                  Supabase (Backend)                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │   Auth   │  │farmers_profile│  │  crops / sensor  │ │
│  │  (Email) │  │   (users)    │  │     _data        │ │
│  └──────────┘  └──────────────┘  └──────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **pnpm** ≥ 8.x (`npm install -g pnpm`)
- **Supabase** project (free tier works)
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/apikey))

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
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous/public key |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key (server-side only) |

> **Note:** `GEMINI_API_KEY` is never exposed to the client. All AI calls are routed through server-side API routes.

---

## 📁 Project Structure

```
smartkisan-ai/
├── app/
│   ├── layout.tsx                  # Root layout (fonts, metadata, analytics)
│   ├── page.tsx                    # Main page — orchestrates all sections
│   ├── globals.css                 # Global styles
│   └── api/
│       ├── analyze-crop/
│       │   └── route.ts            # POST — Gemini Vision crop analysis
│       ├── predict-yield/
│       │   └── route.ts            # POST — AI yield prediction
│       └── gov-schemes/
│           └── route.ts            # GET  — Real govt scheme fetcher
│
├── components/
│   ├── smart-kisan/
│   │   ├── navbar.tsx              # Top navigation + auth controls
│   │   ├── hero-section.tsx        # Landing hero with CTA buttons
│   │   ├── crop-disease-scanner.tsx# AI crop scanner (upload + results)
│   │   ├── crop-image-analyzer.tsx # Image analysis display component
│   │   ├── farmer-dashboard.tsx    # Dynamic farm overview (Supabase-driven)
│   │   ├── farmer-profile.tsx      # Profile + crop CRUD management
│   │   ├── soil-analytics.tsx      # NPK / moisture / temp charts
│   │   ├── gov-schemes.tsx         # Live government schemes display
│   │   └── footer.tsx              # Site footer
│   ├── ui/                         # Radix UI + shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── tabs.tsx
│   │   ├── progress.tsx
│   │   ├── badge.tsx
│   │   └── ... (40+ components)
│   └── theme-provider.tsx          # Dark/light theme context
│
├── hooks/
│   ├── use-mobile.ts               # Mobile breakpoint detection
│   └── use-toast.ts                # Toast notification hook
│
├── lib/
│   ├── supabase.ts                 # Supabase client singleton
│   └── utils.ts                    # Utility functions (cn, etc.)
│
├── public/
│   └── images/                     # Static assets
│
├── styles/
│   └── globals.css                 # Additional global styles
│
├── next.config.mjs                 # Next.js config + security headers
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies and scripts
└── pnpm-lock.yaml                  # Lockfile
```

---

## 📡 API Reference

### `POST /api/analyze-crop`

Analyze a crop image using Gemini Vision AI.

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
      "issues": [],
      "issues_hi": []
    },
    "nutrition": { ... },
    "irrigation": { ... },
    "harvest": {
      "estimated_time": "3-4 weeks",
      "growth_stage": "Grain Filling",
      "recommendation": "..."
    },
    "additional_tips": [...]
  }
}
```

**Error Responses:** `400` (invalid image / not a crop), `429` (rate limited), `500` (server error)

---

### `POST /api/predict-yield`

Predict crop yield based on field data and sensor readings.

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
    "factors": [...],
    "recommendation": "...",
    "recommendation_hindi": "..."
  }
}
```

---

### `GET /api/gov-schemes?state=Maharashtra`

Fetch real, active government schemes for Indian farmers.

**Query Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `state` | string | `India` | Target state for state-specific schemes |

**Response (200):**
```json
{
  "schemes": [
    {
      "name": "PM-KISAN Samman Nidhi",
      "name_hi": "पीएम-किसान सम्मान निधि",
      "description": "...",
      "benefit": "₹6,000/year in 3 installments",
      "category": "Income Support",
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
| `village` | text | Village name |
| `state` | text | State |

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

---

## 🔐 Security

| Measure | Implementation |
|---------|---------------|
| **Security Headers** | `X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`, `Permissions-Policy` configured in `next.config.mjs` |
| **Rate Limiting** | In-memory per-IP rate limiter on all API routes (5-10 req/min) |
| **Input Validation** | Type checking, size limits, and sanitization on all API inputs |
| **API Key Protection** | `GEMINI_API_KEY` is server-side only — never sent to client |
| **Auth** | Supabase Auth with Row-Level Security (RLS) on database tables |
| **Cache Control** | API responses return `Cache-Control: no-store` |
| **Camera Permissions** | `Permissions-Policy: camera=(self)` — camera access restricted to same origin |

---

## 🗺️ Roadmap

### ✅ Phase 1 — Core Platform (Completed)
- [x] Landing page with bilingual hero section
- [x] Supabase authentication (signup / login / logout)
- [x] Farmer profile management with crop CRUD
- [x] Soil analytics dashboard with NPK charts
- [x] Weather overview panel
- [x] Farm activity tracker
- [x] Responsive design with mobile navigation
- [x] Dark / light theme support

### ✅ Phase 2 — AI Integration (Completed)
- [x] Gemini Vision AI crop disease scanner
- [x] Non-crop image rejection with intelligent validation
- [x] AI-powered yield prediction engine
- [x] Real government schemes via Gemini (live `.gov.in` links)
- [x] Multi-model failover (4 Gemini models with exponential backoff)
- [x] Bilingual AI responses (English + Hindi)

### ✅ Phase 3 — Security & Reliability (Completed)
- [x] Security headers (XSS, clickjacking, MIME sniffing protection)
- [x] Per-IP rate limiting on all API endpoints
- [x] Input validation and sanitization
- [x] Base64 image size limits
- [x] API response cache control

### 🔄 Phase 4 — Enhanced Personalization (In Progress)
- [x] Dynamic farm dashboard (empty until crops added)
- [x] Crop selector for multi-crop farms
- [x] Auto-calculated growth progress from sowing date
- [ ] Push notifications for irrigation / fertilizer reminders
- [ ] Historical crop data comparison
- [ ] Multi-language support beyond Hindi (Marathi, Tamil, Telugu, Punjabi)

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
- All API changes must include rate limiting and input validation
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
