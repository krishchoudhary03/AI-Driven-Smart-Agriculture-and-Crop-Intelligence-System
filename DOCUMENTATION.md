# AI-Driven Smart Agriculture & Crop Intelligence System

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Installation & Setup](#installation--setup)
4. [API Documentation](#api-documentation)
5. [Features](#features)
6. [Testing](#testing)
7. [Security](#security)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Project Overview

**SmartKisan** is an AI-powered agricultural platform designed to empower farmers with intelligent insights for better crop management. The system integrates real-time AI analysis, government scheme information, and comprehensive farm analytics.

### Key Statistics
- **Total Lines of Code**: 213,100
- **Languages**: TypeScript (97.7%), CSS (2.1%), JavaScript (0.2%)
- **Test Coverage**: 70%+ on core utilities
- **Unit Tests**: 139 tests covering validation, formatting, disease detection, and yield prediction

### Team
- **Krish Choudhary** (Lead, 50% contribution)
- **Abhilasha Singh** (27.5% contribution)
- **krishna mishra** (22.5% contribution)

---

## System Architecture

### Tech Stack
```
Frontend: Next.js 16.1.6 + React 19.2.4 + TypeScript 5.7.3
Styling: Tailwind CSS 4.2.0 + Radix UI/Shadcn UI
Backend: Next.js API Routes
AI/ML: Google Gemini API (v1beta)
Database: Supabase (PostgreSQL)
Testing: Jest 30.3.0 + React Testing Library
Package Manager: pnpm
```

### Project Structure
```
project/
├── app/
│   ├── api/
│   │   ├── analyze-crop/        # Crop disease detection API
│   │   ├── predict-yield/       # Yield prediction API
│   │   ├── gov-schemes/         # Government schemes API
│   │   └── sensor-data/         # IoT sensor data API
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── globals.css              # Global styles
├── components/
│   ├── smart-kisan/             # Feature components
│   │   ├── crop-disease-scanner.tsx
│   │   ├── crop-image-analyzer.tsx
│   │   ├── farmer-dashboard.tsx
│   │   ├── farmer-profile.tsx
│   │   ├── soil-analytics.tsx
│   │   ├── gov-schemes.tsx
│   │   ├── hero-section.tsx
│   │   └── navbar.tsx
│   ├── ui/                      # Reusable UI components (80+)
│   └── theme-provider.tsx       # Theme configuration
├── lib/
│   ├── validation.ts            # Input validation (7 functions, 94% coverage)
│   ├── formatting.ts            # Data formatting & calculations (12 functions, 97% coverage)
│   ├── supabase.ts              # Supabase client
│   └── utils.ts                 # Utility functions
├── hooks/
│   ├── use-mobile.ts            # Mobile detection hook
│   └── use-toast.ts             # Toast notification hook
├── __tests__/                   # Test suite (139 tests)
│   ├── validation.test.ts       # Input validation tests (40+ tests)
│   ├── formatting.test.ts       # Formatting & calculation tests (40+ tests)
│   ├── crop-disease-detection.test.ts  # Disease detection tests (25+ tests)
│   └── yield-prediction.test.ts        # Yield prediction tests (35+ tests)
├── jest.config.js               # Jest configuration
├── jest.setup.js                # Jest test environment setup
├── tsconfig.json                # TypeScript configuration
├── next.config.mjs              # Next.js configuration
└── package.json                 # Dependencies & scripts
```

### Data Flow

```
User Input (Image/Sensor Data)
         ↓
   Input Validation (lib/validation.ts)
         ↓
   API Route (/api/analyze-crop or /api/predict-yield)
         ↓
   Gemini AI Processing
         ↓
   Data Formatting (lib/formatting.ts)
         ↓
   Supabase Storage (optional)
         ↓
   Response to Frontend
         ↓
   UI Rendering (React Components)
```

---

## Installation & Setup

### Prerequisites
- Node.js 18.17+ and pnpm 8+
- Google Gemini API key
- Supabase account (optional)

### Step 1: Clone Repository
```bash
git clone https://github.com/krishchoudhary03/AI-Driven-Smart-Agriculture-and-Crop-Intelligence.git
cd AI-Driven-Smart-Agriculture-and-Crop-Intelligence
```

### Step 2: Install Dependencies
```bash
pnpm install
```

### Step 3: Configure Environment Variables
Create `.env.local` file:
```env
# Required: Google Gemini API
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Application Settings
NEXT_PUBLIC_APP_NAME=SmartKisan
NEXT_PUBLIC_RATE_LIMIT=10
```

### Step 4: Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Step 5: Run Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage
```

---

## API Documentation

### 1. Crop Disease Detection

**Endpoint**: `POST /api/analyze-crop`

**Purpose**: Analyzes crop images using AI to identify diseases and provide treatment recommendations.

**Request Body**:
```typescript
{
  cropName: string;           // Name of the crop (e.g., "Tomato")
  image: string;              // Base64-encoded image (max 20MB)
  fieldSize?: number;         // Field size in hectares (0-10000)
  location?: string;          // Farm location (max 200 chars)
}
```

**Response**:
```typescript
{
  success: boolean;
  data?: {
    disease: string;          // Detected disease name
    confidence: number;       // Confidence score (0-100)
    severity: "Low" | "Medium" | "High";
    treatment: {
      organic: string[];      // Organic treatment options
      chemical: string[];     // Chemical treatment options
      duration: string;       // Expected duration
    };
    recommendations: string[];
  };
  error?: string;
}
```

**Rate Limit**: 10 requests per minute

**Example Usage**:
```typescript
const response = await fetch('/api/analyze-crop', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cropName: 'Tomato',
    image: 'data:image/png;base64,...',
    fieldSize: 2.5,
    location: 'Punjab, India'
  })
});
```

---

### 2. Yield Prediction

**Endpoint**: `POST /api/predict-yield`

**Purpose**: Predicts crop yield based on sensor data, crop type, and environmental factors.

**Request Body**:
```typescript
{
  cropName: string;           // Name of the crop
  cropType?: string;          // Crop classification
  fieldSize?: number;         // Field size in hectares
  location?: string;          // Farm location
  sowingDate?: string;        // ISO date format (YYYY-MM-DD)
  sensor?: {
    moisture?: number;        // Soil moisture (0-100%)
    temperature?: number;     // Temperature (-50 to 60°C)
    nitrogen?: number;        // Nitrogen level (0-500 kg/ha)
    phosphorus?: number;      // Phosphorus level (0-500 kg/ha)
    potassium?: number;       // Potassium level (0-500 kg/ha)
  };
}
```

**Response**:
```typescript
{
  success: boolean;
  data?: {
    yieldRange: {
      min: number;            // Minimum yield (quintal/ha)
      max: number;            // Maximum yield (quintal/ha)
      average: number;        // Average yield estimate
    };
    confidence: number;       // Confidence score (0-100)
    factors: {
      moisture: number;       // Moisture impact
      temperature: number;    // Temperature impact
      npk: number;            // NPK nutrient impact
    };
    recommendations: string[];
    growthStage: string;
    daysToHarvest: number;
  };
  error?: string;
}
```

---

### 3. Government Schemes

**Endpoint**: `GET /api/gov-schemes`

**Purpose**: Fetches current government agricultural schemes for farmers.

**Query Parameters**:
```
state?: string           // Filter by state (e.g., "Punjab")
category?: string        // Filter by category (e.g., "subsidy")
```

**Response**:
```typescript
{
  success: boolean;
  data?: {
    schemes: Array<{
      id: string;
      name: string;
      description: string;
      benefits: string[];
      eligibility: string[];
      applicationDeadline: string;
      contactInfo: string;
    }>;
    totalCount: number;
  };
  error?: string;
}
```

**Caching**: 10 minutes TTL

---

### 4. Sensor Data Integration

**Endpoint**: `POST /api/sensor-data`

**Purpose**: Stores and processes real-time IoT sensor data from farm devices.

**Request Body**:
```typescript
{
  deviceId: string;
  timestamp: string;          // ISO timestamp
  data: {
    temperature: number;
    humidity: number;
    soilMoisture: number;
    soilPH: number;
    lightIntensity?: number;
  };
}
```

---

## Features

### 1. **AI Crop Disease Scanner** ✅
- Analyzes crop images using Google Gemini AI
- Identifies diseases with confidence scores
- Provides treatment recommendations (organic & chemical)
- Supports multiple crop types
- Bilingual support (English & Hindi)

### 2. **Yield Prediction** ✅
- Estimates crop yield using sensor data and environmental factors
- Calculates confidence scores based on data completeness
- Recommends optimal harvest timing
- Considers crop-specific growth cycles

### 3. **Farmer Dashboard** ✅
- Real-time farm analytics and metrics
- Historical crop performance tracking
- Soil quality analysis
- Weather forecasting integration

### 4. **Farmer Profile Management** ✅
- Manage farm details and crop information
- Track crop history and yields
- Store field/farm boundaries

### 5. **Real-time Government Schemes** ✅
- Current agricultural subsidies and schemes
- Eligibility criteria matching
- Application deadline tracking
- Bilingual descriptions

### 6. **Soil Analytics** ✅
- NPK (Nitrogen, Phosphorus, Potassium) analysis
- pH level monitoring
- Soil moisture tracking
- Nutrient deficiency detection

---

## Testing

### Test Coverage Summary
```
File               Coverage        Tests
──────────────────────────────────────────
validation.ts      94.11%          40+ tests
formatting.ts      97.59%          40+ tests
Disease Detection   N/A             25+ tests
Yield Prediction    N/A             35+ tests
──────────────────────────────────────────
Total               70%+            139 tests
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test validation.test.ts

# Watch mode (auto-run on file changes)
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Run with detailed output
pnpm test -- --verbose
```

### Test Categories

1. **Input Validation Tests** (40+ tests)
   - Crop name validation
   - Base64 image validation
   - Sensor data validation
   - Field size validation
   - Location validation
   - Comprehensive yield prediction input validation

2. **Data Formatting Tests** (40+ tests)
   - Yield formatting
   - Temperature/moisture formatting
   - NPK value formatting
   - Date formatting
   - Confidence score calculation
   - Days-to-harvest calculation
   - JSON response parsing

3. **Crop Disease Detection Tests** (25+ tests)
   - Response structure validation
   - Severity classification
   - Treatment recommendations
   - Edge cases and error handling

4. **Yield Prediction Tests** (35+ tests)
   - Yield range calculations
   - Confidence scoring
   - Sensor data integration
   - Multiple scenario validation

---

## Security

### Security Best Practices Implemented

#### ✅ **Input Validation**
```typescript
// All user inputs validated before processing
import { validateCropName, validateBase64Image } from '@/lib/validation'

const result = validateCropName(userInput)
if (!result.valid) {
  return { error: result.error }
}
```

#### ✅ **Rate Limiting**
```typescript
// 10 requests per minute per IP
const rateLimit = (req) => {
  const ip = req.headers['x-forwarded-for'] || 'unknown'
  // Rate limiting logic...
}
```

#### ✅ **Environment Variables**
```env
NEXT_PUBLIC_GEMINI_API_KEY=***
NEXT_PUBLIC_SUPABASE_ANON_KEY=***
```

#### ✅ **Error Handling**
- No sensitive data in error messages
- Proper HTTP status codes
- Detailed logging for debugging

### Recommended Security Enhancements

1. **Authentication & Authorization**
   - Implement Supabase Auth for user login
   - Role-based access control (admin, farmer, advisor)
   - JWT token validation

2. **HTTPS & Security Headers**
   - Enable HTTPS in production
   - Add security headers (CSP, X-Frame-Options, etc.)
   - Configure CORS properly

3. **Data Protection**
   - Encrypt sensitive data at rest
   - Use parameterized queries for database
   - Implement password hashing with bcrypt

4. **API Security**
   - API key rotation
   - Request signing
   - DDoS protection

---

## Deployment

### Prerequisites
- Vercel account (for frontend)
- Google Cloud Platform account (for Gemini API)
- Supabase account

### Deploy to Vercel

```bash
# 1. Install Vercel CLI
pnpm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel

# 4. Set environment variables in Vercel dashboard
# NEXT_PUBLIC_GEMINI_API_KEY=your_key
# NEXT_PUBLIC_SUPABASE_URL=your_url
```

### Environment Variables for Production
```env
# Production Gemini API
NEXT_PUBLIC_GEMINI_API_KEY=prod_key
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=prod_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod_key

# Rate limiting
RATE_LIMIT_PER_MINUTE=10

# App settings
NEXT_PUBLIC_APP_NAME=SmartKisan
LOG_LEVEL=info
```

### Database Migration (Supabase)

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE,
  full_name TEXT,
  farm_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create crops table
CREATE TABLE crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT,
  type TEXT,
  area_hectares NUMERIC,
  sowing_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID REFERENCES crops(id),
  yield_min NUMERIC,
  yield_max NUMERIC,
  confidence NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Troubleshooting

### Issue: "Cannot use import statement outside a module"
**Solution**: Ensure `jest.setup.js` uses CommonJS syntax:
```javascript
// ❌ Wrong
import '@testing-library/jest-dom'

// ✅ Correct
require('@testing-library/jest-dom')
```

### Issue: Gemini API Rate Limit Exceeded
**Solution**: 
- Add request queuing
- Implement exponential backoff retry
- Use rate limiting middleware

```typescript
// Rate limiting example
const rateLimitMap = new Map()

function checkRateLimit(ip: string) {
  const now = Date.now()
  const requests = rateLimitMap.get(ip) || []
  const recentRequests = requests.filter(t => now - t < 60000)
  
  if (recentRequests.length >= 10) {
    throw new Error('Rate limit exceeded')
  }
  
  recentRequests.push(now)
  rateLimitMap.set(ip, recentRequests)
}
```

### Issue: Image Upload Fails
**Ensure**:
- Image is properly encoded in Base64
- Image size < 20MB
- Image format is supported (JPG, PNG, GIF)

### Issue: Yield Prediction Returns Null
**Check**:
- Sowing date is valid ISO format (YYYY-MM-DD)
- Sensor data values are within acceptable ranges
- Crop type is recognized

---

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

### Code Standards
- Use TypeScript with strict mode
- Write unit tests for new utilities
- Follow ESLint configuration
- Add JSDoc comments for public functions
- Maintain 70%+ code coverage

---

## License

This project is licensed under the MIT License - see LICENSE file for details.

---

## Support & Contact

For issues, questions, or suggestions:
- **GitHub Issues**: https://github.com/krishchoudhary03/AI-Driven-Smart-Agriculture-and-Crop-Intelligence/issues
- **Email**: support@smartkisan.com
- **Documentation**: See [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**Last Updated**: April 21, 2026
**Version**: 1.0.0
