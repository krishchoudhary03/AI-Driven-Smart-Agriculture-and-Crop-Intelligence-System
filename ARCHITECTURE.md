# System Architecture & Design Patterns

## Architecture Overview

SmartKisan follows a **Modern Full-Stack Next.js Architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pages (page.tsx)                                    │  │
│  │  ├─ Home / Hero Section                             │  │
│  │  ├─ Farmer Dashboard                               │  │
│  │  ├─ Crop Disease Scanner                           │  │
│  │  └─ Gov Schemes                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Component Layer (Smart-Kisan Components)            │  │
│  │  ├─ crop-disease-scanner.tsx                        │  │
│  │  ├─ crop-image-analyzer.tsx                         │  │
│  │  ├─ farmer-dashboard.tsx                            │  │
│  │  ├─ soil-analytics.tsx                              │  │
│  │  └─ UI Components (80+ Shadcn/Radix components)   │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Hooks Layer (Custom React Hooks)                    │  │
│  │  ├─ use-mobile.ts                                  │  │
│  │  └─ use-toast.ts                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓ API Calls
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Next.js Routes)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes (app/api/)                               │  │
│  │  ├─ /api/analyze-crop          [POST]               │  │
│  │  ├─ /api/predict-yield         [POST]               │  │
│  │  ├─ /api/gov-schemes           [GET]                │  │
│  │  └─ /api/sensor-data           [POST]               │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Middleware Layer                                    │  │
│  │  ├─ Input Validation (lib/validation.ts)           │  │
│  │  ├─ Rate Limiting                                  │  │
│  │  ├─ Error Handling                                 │  │
│  │  └─ Data Formatting (lib/formatting.ts)            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                 External Services Layer                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Google Gemini API (AI Models)                       │  │
│  │  ├─ gemini-2.5-flash-lite (Primary)                │  │
│  │  ├─ gemini-2.0-flash-lite (Fallback 1)             │  │
│  │  └─ gemini-2.5-flash (Fallback 2)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase (Backend as a Service)                     │  │
│  │  ├─ Authentication                                 │  │
│  │  ├─ PostgreSQL Database                            │  │
│  │  └─ Real-time Subscriptions                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Crop Disease Detection Flow

```
User Upload Image
       ↓
[Client] Convert to Base64
       ↓
POST /api/analyze-crop
       ↓
[API Route] validate Input
  - Validate crop name
  - Validate image format (base64)
  - Validate image size < 20MB
       ↓
[Validation Pass?]
  ├─→ No: Return error
  └─→ Yes: Continue
       ↓
[Gemini API] Analyze Image
  - Primary: gemini-2.5-flash-lite
  - Fallback: gemini-2.0-flash-lite
  - Fallback: gemini-2.5-flash
       ↓
[Format Response]
  - Extract disease name
  - Calculate confidence
  - Generate recommendations
       ↓
[Store in Supabase] (Optional)
  - predictions table
  - crop_history table
       ↓
Return JSON Response
       ↓
[Client] Render Results
  - Disease name & confidence
  - Severity level
  - Treatment options
  - Recommendations
```

### 2. Yield Prediction Flow

```
User Input Sensor Data
       ↓
[Client] Collect Data
  - Crop type
  - Sowing date
  - Sensor readings (moisture, temp, NPK)
       ↓
POST /api/predict-yield
       ↓
[API Route] Validate Input
  - validateCropName()
  - validateSensorData()
  - validateFieldSize()
       ↓
[Validation Pass?]
  ├─→ No: Return validation errors
  └─→ Yes: Continue
       ↓
[Calculate Confidence Score]
  Base: 50
  + 10 if moisture data present
  + 10 if temperature data present
  + 15 if NPK data present
  + 15 if sowing date present
  = Max 100
       ↓
[Gemini API] Generate Prediction
  - Input: Crop type + sensor data
  - Output: Yield range (min-max)
       ↓
[Format Response] (lib/formatting.ts)
  - formatYield(yieldValue)
  - calculateDaysToHarvest()
  - getConfidenceLevel()
       ↓
Return Yield Prediction
       ↓
[Client] Display Prediction
  - Yield range with confidence
  - Days to harvest
  - Recommendations
```

---

## Key Design Patterns

### 1. **Validation Pattern**
```typescript
// Pattern: Validation objects with errors map
interface ValidationResult {
  valid: boolean
  error?: string
}

// Implementation in lib/validation.ts
export function validateCropName(name: unknown): ValidationResult {
  if (!name) return { valid: false, error: 'Crop name is required' }
  if (typeof name !== 'string') return { valid: false, error: 'Must be string' }
  if (name.trim().length === 0) return { valid: false, error: 'Cannot be empty' }
  return { valid: true }
}

// Usage in API routes
const result = validateCropName(input)
if (!result.valid) {
  return NextResponse.json({ error: result.error }, { status: 400 })
}
```

### 2. **Formatting Pattern**
```typescript
// Pattern: Utility functions for consistent data formatting
export function formatYield(value: number): string {
  if (!isFinite(value)) return 'N/A'
  return `${value.toFixed(2)} q/ha`
}

// Usage in API responses
const response = {
  yieldMin: formatYield(minYield),
  yieldMax: formatYield(maxYield),
  confidence: getConfidenceLevel(score)
}
```

### 3. **Error Handling Pattern**
```typescript
// Pattern: Consistent error response format
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Implementation in routes
try {
  const result = await analyzeWithAI(data)
  return NextResponse.json({ success: true, data: result })
} catch (error) {
  return NextResponse.json(
    { success: false, error: extractErrorMessage(error) },
    { status: 500 }
  )
}
```

### 4. **Rate Limiting Pattern**
```typescript
// Pattern: Per-IP rate limiting
const rateLimitMap = new Map<string, number[]>()
const LIMIT = 10 // requests per minute
const WINDOW = 60000 // 1 minute in ms

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const requests = rateLimitMap.get(ip) || []
  const recent = requests.filter(t => now - t < WINDOW)
  
  if (recent.length >= LIMIT) return false
  recent.push(now)
  rateLimitMap.set(ip, recent)
  return true
}
```

### 5. **Caching Pattern** (Gov Schemes)
```typescript
// Pattern: Time-based cache with TTL
class CacheManager {
  private cache = new Map<string, { data: any; expires: number }>()
  
  get(key: string) {
    const item = this.cache.get(key)
    if (!item || Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    return item.data
  }
  
  set(key: string, data: any, ttlMs: number = 600000) {
    this.cache.set(key, { data, expires: Date.now() + ttlMs })
  }
}
```

---

## Component Architecture

### Smart-Kisan Components

```
Smart-Kisan Components/
├── CropDiseaseScanner
│   ├── Purpose: Main disease detection interface
│   ├── Props: onAnalyze, initialData
│   ├── State: image, loading, results
│   └── Dependencies: crop-image-analyzer
│
├── CropImageAnalyzer
│   ├── Purpose: Image upload & analysis UI
│   ├── Props: onImageSelect, onAnalyze
│   ├── State: selectedImage, cropType, location
│   └── Dependencies: Input, Button, Toast
│
├── FarmerDashboard
│   ├── Purpose: Main dashboard with analytics
│   ├── Props: farmerId, initialData
│   ├── State: selectedCrop, timeRange, filters
│   └── Sections: Chart, Stats, RecentActivity
│
├── FarmerProfile
│   ├── Purpose: User profile & farm management
│   ├── Props: userId, onUpdate
│   ├── State: profileData, crops, editing
│   └── Sections: PersonalInfo, FarmDetails, CropHistory
│
├── SoilAnalytics
│   ├── Purpose: Soil quality & NPK analysis
│   ├── Props: soilData, fieldId
│   ├── State: selectedMetric, timeRange
│   └── Sections: NPKChart, MoistureChart, pHChart
│
├── GovSchemes
│   ├── Purpose: Display government schemes
│   ├── Props: state, category
│   ├── State: schemes, filters, selectedScheme
│   └── Sections: SchemeList, Details, ApplicationForm
│
├── HeroSection
│   ├── Purpose: Landing page hero
│   └── Props: onGetStarted, callToAction
│
└── Navbar
    ├── Purpose: Navigation & user menu
    ├── Props: user, onLogout
    └── Features: Mobile menu, ThemeToggle
```

---

## Database Schema (Supabase)

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  farm_name TEXT,
  state TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crops table
CREATE TABLE crops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  variety TEXT,
  area_hectares NUMERIC,
  sowing_date DATE,
  expected_harvest_date DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID REFERENCES crops(id) ON DELETE CASCADE,
  prediction_type TEXT,
  yield_min NUMERIC,
  yield_max NUMERIC,
  yield_avg NUMERIC,
  confidence NUMERIC,
  factors JSONB,
  recommendations TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Disease detection results
CREATE TABLE disease_detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID REFERENCES crops(id) ON DELETE CASCADE,
  disease_name TEXT,
  confidence NUMERIC,
  severity TEXT,
  treatment_organic TEXT[],
  treatment_chemical TEXT[],
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sensor readings
CREATE TABLE sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crop_id UUID REFERENCES crops(id) ON DELETE CASCADE,
  device_id TEXT,
  temperature NUMERIC,
  humidity NUMERIC,
  soil_moisture NUMERIC,
  soil_ph NUMERIC,
  nitrogen NUMERIC,
  phosphorus NUMERIC,
  potassium NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_crops_user_id ON crops(user_id);
CREATE INDEX idx_predictions_crop_id ON predictions(crop_id);
CREATE INDEX idx_disease_detections_crop_id ON disease_detections(crop_id);
CREATE INDEX idx_sensor_readings_crop_id ON sensor_readings(crop_id);
CREATE INDEX idx_sensor_readings_created_at ON sensor_readings(created_at DESC);
```

---

## API Rate Limiting Strategy

```typescript
// Implemented in each route
const rate Limit = 10 requests per minute per IP

// Rate limit headers in response
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1713667200

// Exceeded response (429)
{
  "success": false,
  "error": "Rate limit exceeded. Max 10 requests per minute"
}
```

---

## Error Handling & Recovery

```typescript
// Gemini API Fallback Strategy
const models = [
  'gemini-2.5-flash-lite',    // Primary (fastest)
  'gemini-2.0-flash-lite',    // Fallback 1
  'gemini-2.5-flash'          // Fallback 2
]

// Retry logic with exponential backoff
async function callWithRetry(prompt: string, maxRetries: number = 3) {
  for (const model of models) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const result = await gemini.generate({
          model,
          prompt,
          generationConfig: { /* config */ }
        })
        return result
      } catch (error) {
        if (attempt === maxRetries - 1 && model === models[models.length - 1]) {
          throw error // All retries exhausted
        }
        // Exponential backoff
        await sleep(Math.pow(2, attempt) * 1000)
      }
    }
  }
}
```

---

## Performance Considerations

### 1. **Image Optimization**
- Compress images before sending to Gemini API
- Implement lazy loading for image galleries
- Use WebP format where supported

### 2. **API Response Caching**
- Cache gov schemes (10-minute TTL)
- Cache AI predictions (if identical input)
- Use browser cache headers

### 3. **Database Optimization**
- Proper indexing on frequently queried fields
- Pagination for large result sets
- Connection pooling with Supabase

### 4. **Frontend Performance**
- Code splitting with Next.js dynamic imports
- Image optimization with Next.js Image component
- React memo for expensive components

---

## Security Architecture

### Request Flow with Security

```
HTTP Request
    ↓
[CORS Check] ← Verify origin
    ↓
[Auth Check] ← Verify JWT token (future)
    ↓
[Rate Limit] ← Check IP-based rate limit
    ↓
[Input Validation] ← Sanitize and validate inputs
    ↓
[Process Request]
    ↓
[Error Handler] ← Don't expose sensitive info
    ↓
[Response with Security Headers]
```

---

## Testing Strategy

```
Unit Tests (139 tests)
├── Validation (40+ tests)
│   ├── Valid inputs
│   ├── Invalid inputs
│   ├── Edge cases
│   └── Type checking
├── Formatting (40+ tests)
│   ├── Value formatting
│   ├── Calculation logic
│   ├── JSON parsing
│   └── Error handling
├── Disease Detection (25+ tests)
│   ├── Response parsing
│   ├── Severity classification
│   ├── Treatment recommendations
│   └── Edge cases
└── Yield Prediction (35+ tests)
    ├── Calculation logic
    ├── Confidence scoring
    ├── Data integration
    └── Edge cases

Integration Tests (Future)
├── API route tests
├── Database interactions
├── External API calls
└── Error scenarios

E2E Tests (Future)
├── User workflows
├── Complete feature flows
└── Cross-browser testing
```

---

## Deployment & Scaling Strategy

### Current: Single-server deployment
```
Vercel (Frontend + API Routes)
  └── Supabase (Database)
       └── Google Gemini API (AI)
```

### Future: Scalable architecture
```
CDN (Cloudflare)
  └── Load Balancer
       ├── API Server 1
       ├── API Server 2
       └── API Server N
            └── Database Cluster (Read replicas)
            └── Cache (Redis)
            └── Message Queue (Bull/RabbitMQ)
```

---

**Last Updated**: April 21, 2026
**Architecture Version**: 1.0
