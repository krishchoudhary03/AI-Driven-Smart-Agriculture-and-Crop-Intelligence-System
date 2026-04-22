# Implementation Guide

## Quick Start

### 1. Installation
```bash
# Install dependencies
pnpm install

# Configure environment variables
cp .env.example .env.local
```

### 2. Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-key>
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_CROP_API_KEY=<optional-dedicated-crop-key>
NEXT_PUBLIC_APP_URL=<your-app-url>
```

### 3. Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

### 4. Development Server
```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start
```

## Architecture Overview

```
app/
├── api/
│   ├── analyze-crop/        # Crop disease detection
│   │   └── route.ts         # POST endpoint with image analysis
│   ├── predict-yield/       # Yield prediction
│   │   └── route.ts         # POST endpoint with sensor data
│   └── gov-schemes/         # Government schemes
│       └── route.ts         # GET endpoint with caching

lib/
├── auth.ts                  # Authentication & authorization
├── security.ts              # Security headers & sanitization
├── errors.ts                # Error handling & retry logic
├── telemetry.ts             # Real-time telemetry & monitoring
├── validation.ts            # Input validation utilities
├── formatting.ts            # Data formatting helpers
├── utils.ts                 # General utilities
└── supabase.ts              # Supabase client

components/
├── smart-kisan/             # Main UI components
├── ui/                      # Reusable UI components
└── theme-provider.tsx       # Theme configuration

__tests__/
├── security-validation.test.ts    # Security & validation tests
├── telemetry.test.ts              # Telemetry tests
├── api-integration.test.ts        # API endpoint tests
├── crop-disease-detection.test.ts # Disease detection tests
├── yield-prediction.test.ts       # Yield prediction tests
├── formatting.test.ts             # Formatting tests
└── validation.test.ts             # Validation tests
```

## Feature Implementation Details

### Crop Disease Detection

**Request Flow:**
1. User uploads image (Base64 encoded)
2. Endpoint validates image size and format
3. Image sent to Gemini API for analysis
4. AI identifies crop and detects diseases
5. Response includes:
   - Disease name (English & Hindi)
   - Confidence level
   - Severity classification
   - Treatment recommendations
   - Prevention tips

**Error Handling:**
- Retries with exponential backoff on service unavailability
- Falls back to alternative Gemini models
- Rate limit handling with appropriate retry-after
- Invalid crop detection (rejects non-crop images)

### Yield Prediction

**Request Parameters:**
- `crop_name` (required): Name of the crop
- `crop_type` (optional): Specific variety
- `field_size` (optional): Size in hectares
- `location` (optional): Geographic location
- `sowing_date` (optional): Date of sowing
- `sensor` (optional): Current sensor readings

**Response:**
- Predicted yield (quintals/hectare)
- Yield range (min-max confidence interval)
- Confidence percentage
- Growth stage
- Influencing factors
- Harvest recommendations

### Government Schemes

**Features:**
- State-based scheme recommendations
- Real-time caching (10-minute TTL)
- Fallback to static schemes if API unavailable
- Bilingual support (English & Hindi)
- Direct application links

**Cache Strategy:**
- Reduces API calls by caching per state
- Automatic refresh after 10 minutes
- Graceful degradation with fallback data

## Security Implementation

### Authentication Flow

```typescript
// Sign up
const { data, error } = await signUpUser(email, password)

// Sign in
const { data, error } = await signInUser(email, password)

// Get current user
const user = await getCurrentUser()

// Check permissions
const canAccess = hasRole(user, 'admin')
```

### API Request Security

**Headers Added to All Responses:**
```
Content-Security-Policy: ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Input Sanitization:**
```typescript
import { sanitizeInput, sanitizeObject } from '@/lib/security'

// Sanitize single string
const cleanInput = sanitizeInput(userInput)

// Sanitize entire object
const cleanData = sanitizeObject(req.body)
```

### Rate Limiting

```typescript
import { checkRateLimit, getClientIp } from '@/lib/security'

const ip = getClientIp(req)
const { limited, retryAfterSec } = checkRateLimit(ip, 10, 60000)

if (limited) {
  return createErrorResponse('Rate limited', 429, { 
    retryAfter: retryAfterSec 
  })
}
```

## Error Handling Patterns

### Retry with Exponential Backoff

```typescript
import { withRetry } from '@/lib/errors'

const result = await withRetry(
  async () => apiCall(),
  {
    maxRetries: 3,
    initialDelayMs: 1000,
    backoffMultiplier: 2
  },
  (attempt, error) => console.log(`Retry ${attempt}:`, error.message)
)
```

### Circuit Breaker Pattern

```typescript
import { CircuitBreaker } from '@/lib/errors'

const breaker = new CircuitBreaker(
  async () => unreliableService(),
  failureThreshold = 5,
  resetTimeoutMs = 60000
)

try {
  const result = await breaker.execute()
} catch (error) {
  if (error.code === 'CIRCUIT_OPEN') {
    // Fallback behavior
  }
}
```

### Fallback Values

```typescript
import { withFallback } from '@/lib/errors'

const schemes = await withFallback(
  () => fetchSchemes(),
  FALLBACK_SCHEMES,
  (error) => logError(error)
)
```

## Telemetry Integration

### Tracking Events

```typescript
import { TelemetryService } from '@/lib/telemetry'

const telemetry = new TelemetryService(config)

// Track custom event
telemetry.trackEvent('crop_analyzed', userId, {
  disease: 'powdery_mildew',
  confidence: 92
})

// Track error
telemetry.trackError(error, { 
  endpoint: '/api/analyze-crop' 
})

// Add sensor reading
telemetry.addSensorReading(
  'device1',
  'moisture',
  50,
  '%',
  0.95 // accuracy
)

// Get statistics
const stats = telemetry.getSensorStats('moisture')
```

### Performance Monitoring

```typescript
import { PerformanceMonitor } from '@/lib/telemetry'

const monitor = new PerformanceMonitor()

const result = await monitor.measure('crop_analysis', async () => {
  return analyzeCrop(image)
})

const stats = monitor.getStats('crop_analysis')
console.log(`p95: ${stats.p95}ms`)
```

## Testing Strategy

### Writing Tests

```typescript
describe('Feature Name', () => {
  describe('Specific Behavior', () => {
    it('should handle valid input', () => {
      const result = functionUnderTest(validInput)
      expect(result).toBeDefined()
      expect(result.status).toBe(200)
    })

    it('should reject invalid input', () => {
      const result = functionUnderTest(invalidInput)
      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
    })
  })
})
```

### Test Commands

```bash
# Run specific test file
pnpm test -- security-validation.test.ts

# Run tests matching pattern
pnpm test -- --testNamePattern="sanitization"

# Update snapshots
pnpm test -- --updateSnapshot

# Run with coverage threshold
pnpm test -- --coverage --collectCoverageFrom="src/**/*.ts"
```

## Performance Optimization

### Caching Strategy
- Government schemes cached for 10 minutes
- Sensor data aggregated before telemetry publish
- Image validation cached during request lifecycle

### Request Optimization
- Parallel model attempts for robustness
- In-memory rate limiting for low latency
- Batch telemetry events before publishing

### Database Optimization
- Index user profiles by ID and email
- Index sensor readings by device and timestamp
- Use connection pooling for Supabase

## Troubleshooting

### Common Issues

**Rate Limit Errors:**
- Check rate limit configuration per endpoint
- Verify client IP extraction (x-forwarded-for header)
- Review rate limit reset window

**API Errors:**
- Verify API keys are configured
- Check service availability
- Review error logs for specific failures

**Validation Failures:**
- Verify input format matches specification
- Check size limits (images, text)
- Validate numeric ranges

**Authentication Issues:**
- Verify Supabase configuration
- Check JWT token expiration
- Review user role assignments

## Deployment Checklist

- [ ] All environment variables set
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured for production
- [ ] Error logging configured
- [ ] Telemetry endpoint active
- [ ] Database migrations run
- [ ] Tests passing (>85% coverage)
- [ ] Security headers verified
- [ ] CORS origins configured
- [ ] Monitoring alerts set up
