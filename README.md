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

# ✨ Features

### 🔬 AI Crop Disease Scanner

- Upload or capture a crop/plant photo for instant AI analysis
- Identifies crop type, health percentage, growth stage, and estimated harvest time
- Detects diseases, nutrient deficiencies, and irrigation issues
- Returns actionable recommendations in **English & Hindi**
- Rejects non-crop images with an intelligent validation layer
- Powered by **Google Gemini Vision AI** with multi-model failover

---

### 🏛️ Real Government Schemes (Live)

- Fetches **real, currently active** Indian government agricultural schemes via Gemini AI
- Displays official `.gov.in` website links for each scheme
- Supports state-specific scheme filtering
- Shows scheme categories, financial benefits, and eligibility
- Direct "Apply Online" and "Official Website" buttons
- Bilingual display (English + Hindi)

---

### 📊 Dynamic Farm Dashboard

- Personalized "My Farm Overview"
- Crop selection UI when multiple crops are registered
- Auto-calculated growth progress from sowing date
- Weather overview and farm activity tracker
- Fully driven by Supabase data — no hardcoded values

---

### 👤 Farmer Profile & Crop Management

- Supabase-authenticated user registration and login
- Full CRUD operations for crop entries (name, type, field name, field size, location, sowing date)
- Persistent profile data across sessions

---

### 🧪 Soil Analytics

- Visual soil health dashboard with NPK (Nitrogen, Phosphorus, Potassium) levels
- Moisture and temperature monitoring
- Interactive charts powered by **Recharts**
- Sensor readings displayed using **line charts and bar charts** for better visualization
- Historical soil data trends help farmers make better irrigation and fertilizer decisions

---

### 📡 IoT Sensor Data Visualization

- Collects real-time farm sensor readings (soil moisture, temperature, NPK levels)
- Visualizes sensor data using **interactive line charts and bar charts**
- Provides pictorial representation of soil health trends
- Helps farmers easily understand soil conditions through graphical dashboards
- Built using **Recharts** for responsive and dynamic chart rendering

---

### 📈 AI Yield Prediction

- Predict expected yield (quintal/hectare) based on crop data and sensor readings
- Returns confidence score, growth stage, impact factors, and optimization tips
- Bilingual recommendations (English + Hindi)

---

### 🔐 Security Hardened

- Security headers protection
- Rate limiting on API routes
- Input validation and sanitization
- API responses marked `no-store`

---

# 🛠️ Tech Stack

| Layer | Technology |
|------|-----------|
| **Framework** | Next.js 16 |
| **Language** | TypeScript |
| **UI Library** | React 19 |
| **Styling** | Tailwind CSS |
| **AI / ML** | Google Gemini API |
| **Auth & Database** | Supabase |
| **Charts / Visualization** | Recharts 2.15 (Line Charts, Bar Charts, Sensor Data Graphs) |
| **Forms** | React Hook Form + Zod |
| **Icons** | Lucide React |
| **Analytics** | Vercel Analytics |

---

# 🏗️ Architecture

```
Client (Browser)
│
├ Navbar
├ Crop Scanner
├ Farm Dashboard
├ Soil Analytics
└ Government Schemes

        │
        ▼

Next.js API Routes

/api/analyze-crop
/api/predict-yield
/api/gov-schemes

        │
        ▼

Google Gemini AI

Vision Analysis
Yield Prediction

        │
        ▼

Supabase Backend

Auth
Farmers Profile
Crops
Sensor Data

        │
        ▼

Farm IoT Sensor Layer

Soil Sensors → Moisture / Temperature / NPK

Sensor Data → Stored in Supabase

Dashboard Visualization → Recharts
(Line Charts + Bar Charts)
```

---

# 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 8
- Supabase project
- Google Gemini API key

---

### Installation

```bash
git clone https://github.com/your-username/smartkisan-ai.git
cd smartkisan-ai

pnpm install

cp .env.example .env.local

pnpm dev
```

The app will be running at:

```
http://localhost:3000
```

---

# 🔑 Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-key
```

---

# 📁 Project Structure

```
smartkisan-ai
│
├ app
│ ├ layout.tsx
│ ├ page.tsx
│ └ api
│
├ components
│ ├ smart-kisan
│ │ ├ navbar.tsx
│ │ ├ hero-section.tsx
│ │ ├ crop-disease-scanner.tsx
│ │ ├ farmer-dashboard.tsx
│ │ ├ farmer-profile.tsx
│ │ ├ soil-analytics.tsx
│ │ ├ gov-schemes.tsx
│ │ └ footer.tsx
│
├ hooks
├ lib
├ public
├ styles
```

---

# 📡 API Reference

### POST `/api/analyze-crop`

Analyze crop image using AI.

```
{
  "image": "base64-encoded-image"
}
```

---

### POST `/api/predict-yield`

Predict crop yield using farm data and sensor readings.

```
{
 "crop_name": "Rice",
 "sensor": {
  "moisture": 65,
  "temperature": 32,
  "nitrogen": 120,
  "phosphorus": 40,
  "potassium": 60
 }
}
```

---

### GET `/api/gov-schemes`

Fetch government schemes.

---

# 🗃️ Database Schema

### farmers_profile

| Column | Type |
|------|------|
| id | uuid |
| user_id | uuid |
| name | text |
| village | text |
| state | text |

---

### crops

| Column | Type |
|------|------|
| id | uuid |
| farmer_id | uuid |
| crop_name | text |
| crop_type | text |
| field_name | text |
| field_size | text |
| location | text |
| sowing_date | date |

---

### sensor_data

Stores IoT soil sensor readings used for **analytics dashboards and graphical visualization (line charts & bar charts)**.

| Column | Type |
|------|------|
| id | uuid |
| farmer_id | uuid |
| moisture | float |
| temperature | float |
| nitrogen | float |
| phosphorus | float |
| potassium | float |

---

# 🔐 Security

- Security headers
- Rate limiting
- Input validation
- API key protection
- Row-Level Security (Supabase)

---

# 🗺️ Roadmap

### Phase 1 — Core Platform

- Authentication
- Farmer profile
- Crop management
- Soil analytics dashboard

### Phase 2 — AI Integration

- Crop disease detection
- Yield prediction
- Government schemes

### Phase 3 — Data Visualization

- Sensor data storage
- Line chart visualization
- Bar chart nutrient comparison

### Phase 4 — Future Enhancements

- IoT automation
- Market price integration
- Mobile app

---

# 🤝 Contributing

1. Fork repository  
2. Create feature branch  
3. Commit changes  
4. Push branch  
5. Open PR

---

# 📄 License

MIT License

---

<div align="center">

**Built with ❤️ for Indian Farmers | भारतीय किसानों के लिए बनाया गया**

</div>
