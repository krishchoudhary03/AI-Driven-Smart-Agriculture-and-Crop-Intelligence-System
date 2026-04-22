# Security & Architecture Documentation

## Overview
This document outlines the security measures, error handling, and architectural improvements implemented in the SmartKisan AI system.

## Security Implementation

### 1. Authentication & Authorization (lib/auth.ts)
- User registration with password validation (min 8 chars, uppercase, number)
- Email format validation
- Supabase Auth integration for secure authentication
- Role-based access control (RBAC) support
- API token verification for programmatic access

**Key Functions:**
- `getCurrentUser()` - Retrieve authenticated user with role
- `signUpUser(email, password)` - Register new user with validation
- `signInUser(email, password)` - Login with credentials
- `verifyApiToken(token)` - Validate API tokens
- `hasRole(user, requiredRole)` - Check user permissions

### 2. Security Middleware (lib/security.ts)
Comprehensive security headers and CORS configuration for all API routes.

**Security Headers Implemented:**
- **Content-Security-Policy**: Prevents XSS attacks by controlling resource loading
- **X-Content-Type-Options**: Prevents MIME-type sniffing
- **X-Frame-Options**: Clickjacking protection
- **X-XSS-Protection**: Additional XSS protection
- **Strict-Transport-Security**: Enforces HTTPS
- **Permissions-Policy**: Restricts browser features (geolocation, microphone, camera)

**Input Sanitization:**
- `sanitizeInput(input)` - HTML entity encoding for XSS prevention
- `sanitizeObject(obj)` - Recursive sanitization for nested objects and arrays

**CORS Configuration:**
- Environment-aware origin validation
- Configurable allowed methods and headers
- Preflight request handling

**Rate Limiting:**
- Per-IP rate limiting (configurable limits)
- In-memory rate limit tracking
- Sliding window algorithm
- Automatic cleanup on window reset

### 3. Error Handling & Fail-Safe Mechanisms (lib/errors.ts)

#### Error Classes
- `AppError` - Base error with status code and error code
- `ValidationError` - 400 Bad Request
- `AuthenticationError` - 401 Unauthorized
- `AuthorizationError` - 403 Forbidden
- `NotFoundError` - 404 Not Found
- `RateLimitError` - 429 Too Many Requests
- `ExternalServiceError` - 503 Service Unavailable

#### Retry Logic
```typescript
// Exponential backoff retry
await withRetry(fn, {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableStatuses: new Set([408, 429, 500, 502, 503, 504])
})
```

#### Circuit Breaker Pattern
```typescript
const breaker = new CircuitBreaker(fn, failureThreshold, resetTimeout)
const result = await breaker.execute()
```
- Prevents cascading failures
- Automatic recovery after timeout
- Three states: CLOSED, OPEN, HALF_OPEN

#### Fallback Strategy
```typescript
const result = await withFallback(fn, fallbackValue, onError)
```
- Provides graceful degradation
- Optional error callback
- Ensures service availability

## API Security Measures

### Request Validation
All endpoints validate:
- Content-Type headers
- Request body format
- Image size limits (max 15MB encoded)
- Crop name length (max 100 characters)
- Sensor data ranges (moisture 0-100%, temperature -50 to 60°C, NPK 0-500 kg/ha)

### Endpoint-Specific Rate Limits
- `/api/analyze-crop`: 10 requests/minute per IP
- `/api/predict-yield`: 10 requests/minute per IP
- `/api/gov-schemes`: 5 requests/minute per IP

### Response Format
All API responses follow consistent format:
```json
{
  "success": true,
  "data": {...}
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Real-Time Telemetry (lib/telemetry.ts)

### Event Tracking
```typescript
telemetry.trackEvent('event_type', userId, metadata)
telemetry.trackError(error, context)
```

### Sensor Data Collection
```typescript
telemetry.addSensorReading(deviceId, sensorType, value, unit, accuracy)
const stats = telemetry.getSensorStats(sensorType)
```

### Features
- Event batching for efficiency
- Auto-flush with configurable intervals
- Sensor data aggregation and statistics
- Performance monitoring with percentiles
- Local storage fallback for offline scenarios

### Data Publishing
- HTTP endpoint publishing
- Local storage caching
- Retry mechanism for failed publishes

## Validation (lib/validation.ts)

### Input Validation Functions
- `validateCropName(name)` - Ensure valid crop identifier
- `validateBase64Image(image)` - Validate image format and size
- `validateSensorData(sensor)` - Verify sensor readings are in acceptable ranges

### Validation Rules
| Field | Rules |
|-------|-------|
| Crop Name | 1-100 characters, non-empty |
| Base64 Image | Max 20MB encoded, valid format |
| Soil Moisture | 0-100% |
| Temperature | -50°C to 60°C |
| NPK Nutrients | 0-500 kg/ha each |

## Test Coverage

### Test Suites
1. **security-validation.test.ts** - Security and input validation tests
2. **telemetry.test.ts** - Telemetry and monitoring tests
3. **api-integration.test.ts** - API endpoint validation tests
4. **crop-disease-detection.test.ts** - Disease detection logic
5. **yield-prediction.test.ts** - Yield prediction validation
6. **formatting.test.ts** - Data formatting utilities
7. **validation.test.ts** - Input validation rules

### Coverage Targets
- Security utilities: 95%+
- Error handling: 90%+
- Validation: 95%+
- API responses: 85%+

## Deployment Checklist

Before deploying to production:

- [ ] Set all environment variables (GEMINI_API_KEY, SUPABASE_URL, etc.)
- [ ] Enable HTTPS in deployment
- [ ] Configure appropriate CORS origins
- [ ] Set up error logging service
- [ ] Configure telemetry endpoint
- [ ] Run full test suite
- [ ] Perform security audit
- [ ] Set up monitoring and alerting
- [ ] Configure backup and recovery procedures

## Best Practices

### For Developers
1. Always validate user input before processing
2. Use `withRetry()` for external API calls
3. Implement error boundaries in UI
4. Track errors with `logError()`
5. Use `sanitizeObject()` before sending data to client
6. Implement rate limiting checks early in request handlers

### For Operations
1. Monitor rate limit metrics
2. Track API error rates and response times
3. Set up alerts for circuit breaker state changes
4. Regularly review security logs
5. Update security dependencies quarterly
6. Perform penetration testing annually

## Security Considerations

### Known Limitations
- In-memory rate limiting resets on server restart
- Circuit breaker state not persisted across instances
- Local storage telemetry limited to device storage capacity

### Future Improvements
- Redis-based distributed rate limiting
- Database-backed circuit breaker state
- Enhanced audit logging
- Two-factor authentication support
- API key rotation mechanism

## References
- OWASP Top 10 mitigation strategies implemented
- Express.js security best practices
- Next.js security documentation
- Supabase authentication guide
