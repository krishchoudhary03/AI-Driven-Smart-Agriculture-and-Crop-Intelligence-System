# Testing & Quality Assurance Guide

## Test Coverage Metrics

### Current Coverage Target: 85%+

```
Statements   : 85%+ (All logical paths covered)
Branches     : 80%+ (All if/else branches tested)
Functions    : 85%+ (All functions called)
Lines        : 85%+ (All lines executed)
```

## Test Suites Overview

### 1. Security & Validation Tests
**File:** `__tests__/security-validation.test.ts`
**Coverage:** 95%+

Tests included:
- Input sanitization (HTML escaping, quote handling)
- Object and array sanitization
- Auth header validation
- Rate limiting logic
- Client IP extraction
- CORS configuration
- Error classes
- Retry mechanisms
- Fallback strategies
- Circuit breaker pattern
- JSON parsing edge cases

### 2. Telemetry Tests
**File:** `__tests__/telemetry.test.ts`
**Coverage:** 85%+

Tests included:
- Event buffering and batching
- Sensor data collection
- Time-range filtering
- Average calculations
- Performance monitoring
- Percentile calculations (p95, p99)
- Statistics aggregation

### 3. API Integration Tests
**File:** `__tests__/api-integration.test.ts`
**Coverage:** 80%+

Tests included:
- Crop name validation
- Image validation (format, size)
- Sensor data range validation
- Response format consistency
- Bilingual support verification
- Rate limit verification
- Error handling in validation

### 4. Crop Disease Detection Tests
**File:** `__tests__/crop-disease-detection.test.ts`
**Coverage:** 85%+

Tests included:
- Disease detection response parsing
- Severity classification
- Treatment recommendations
- Multiple disease handling
- Confidence score validation

### 5. Yield Prediction Tests
**File:** `__tests__/yield-prediction.test.ts`
**Coverage:** 80%+

### 6. Formatting Tests
**File:** `__tests__/formatting.test.ts`
**Coverage:** 85%+

### 7. Validation Tests
**File:** `__tests__/validation.test.ts`
**Coverage:** 90%+

## Running Tests

### Local Testing

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test -- security-validation.test.ts

# Run in watch mode for development
pnpm test:watch

# Generate coverage report
pnpm test:coverage

# Run with specific pattern
pnpm test -- --testNamePattern="sanitization"
```

### Coverage Report

```bash
# View HTML coverage report
pnpm test:coverage
# Open coverage/lcov-report/index.html in browser
```

## Writing New Tests

### Test Template

```typescript
describe('Module Name', () => {
  // Setup before each test
  beforeEach(() => {
    // Initialize test fixtures
  })

  // Cleanup after each test
  afterEach(() => {
    // Reset state
  })

  describe('Specific Feature', () => {
    it('should handle valid input', () => {
      // Arrange
      const input = validTestData

      // Act
      const result = functionUnderTest(input)

      // Assert
      expect(result).toBeDefined()
      expect(result.status).toBe(200)
    })

    it('should reject invalid input', () => {
      // Test error cases
      expect(() => functionUnderTest(invalidData)).toThrow()
    })
  })
})
```

### Best Practices

1. **Clear Test Names**
   ```typescript
   // Good
   it('should return 429 when rate limit exceeded')
   
   // Bad
   it('returns error')
   ```

2. **Arrange-Act-Assert Pattern**
   ```typescript
   it('should sanitize HTML', () => {
     // Arrange
     const input = '<script>alert(1)</script>'
     
     // Act
     const result = sanitizeInput(input)
     
     // Assert
     expect(result).not.toContain('<script>')
   })
   ```

3. **Test Edge Cases**
   ```typescript
   it('should handle empty string', () => {
     const result = validateInput('')
     expect(result.valid).toBe(false)
   })

   it('should handle null', () => {
     const result = validateInput(null)
     expect(result.valid).toBe(false)
   })

   it('should handle very long string', () => {
     const result = validateInput('a'.repeat(10000))
     expect(result.valid).toBe(false)
   })
   ```

4. **Test Async Code**
   ```typescript
   it('should retry on failure', async () => {
     const fn = jest.fn()
       .mockRejectedValueOnce(new Error('fail'))
       .mockResolvedValueOnce('success')
     
     const result = await withRetry(fn)
     expect(result).toBe('success')
     expect(fn).toHaveBeenCalledTimes(2)
   })
   ```

## Unit Testing Examples

### Testing Input Validation

```typescript
describe('Validation', () => {
  describe('Crop Name Validation', () => {
    const validCrops = [
      'Wheat',
      'Rice',
      'Corn',
      'Sugarcane-Hybrid',
      'Sweet Corn'
    ]

    const invalidCrops = [
      '',
      '   ',
      'a'.repeat(101),
      null,
      undefined
    ]

    validCrops.forEach(crop => {
      it(`should accept "${crop}"`, () => {
        const result = validateCropName(crop)
        expect(result.valid).toBe(true)
      })
    })

    invalidCrops.forEach(crop => {
      it(`should reject "${crop}"`, () => {
        const result = validateCropName(crop)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      })
    })
  })
})
```

### Testing Security Functions

```typescript
describe('Security Sanitization', () => {
  describe('Input Escaping', () => {
    const testCases = [
      {
        input: '<script>alert("XSS")</script>',
        shouldContain: '&lt;',
        shouldNotContain: '<script>'
      },
      {
        input: 'Test "quoted"',
        shouldContain: '&quot;',
        shouldNotContain: '"'
      },
      {
        input: 'Tom & Jerry',
        shouldContain: '&amp;',
        shouldNotContain: '&[^a]'
      }
    ]

    testCases.forEach(({ input, shouldContain, shouldNotContain }) => {
      it(`should escape "${input.slice(0, 20)}"`, () => {
        const result = sanitizeInput(input)
        expect(result).toContain(shouldContain)
        expect(result).not.toMatch(shouldNotContain)
      })
    })
  })
})
```

### Testing Error Handling

```typescript
describe('Error Handling', () => {
  describe('Retry Logic', () => {
    it('should retry and succeed', async () => {
      let attempts = 0
      const fn = jest.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          throw new Error('fail')
        }
        return 'success'
      })

      const result = await withRetry(fn, { maxRetries: 3 })
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should fail after max retries', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('always fail'))
      
      await expect(
        withRetry(fn, { maxRetries: 2 })
      ).rejects.toThrow('always fail')
      
      expect(fn).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
    })
  })
})
```

### Testing Rate Limiting

```typescript
describe('Rate Limiting', () => {
  it('should allow requests below limit', () => {
    const result = checkRateLimit('192.168.1.1', 5, 60000)
    expect(result.limited).toBe(false)
    expect(result.retryAfterSec).toBe(0)
  })

  it('should block requests exceeding limit', () => {
    for (let i = 0; i < 6; i++) {
      checkRateLimit('192.168.1.2', 5, 60000)
    }
    const result = checkRateLimit('192.168.1.2', 5, 60000)
    expect(result.limited).toBe(true)
    expect(result.retryAfterSec).toBeGreaterThan(0)
  })

  it('should allow different IPs independently', () => {
    const ip1 = '192.168.1.1'
    const ip2 = '192.168.1.2'

    for (let i = 0; i < 6; i++) {
      checkRateLimit(ip1, 5, 60000)
    }

    const result2 = checkRateLimit(ip2, 5, 60000)
    expect(result2.limited).toBe(false)
  })
})
```

## Integration Testing

### Testing API Endpoints

```typescript
describe('API Endpoints', () => {
  describe('POST /api/analyze-crop', () => {
    it('should analyze valid crop image', async () => {
      const response = await fetch('/api/analyze-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: validBase64Image
        })
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.data.analysis).toBeDefined()
    })

    it('should reject oversized image', async () => {
      const largeImage = 'a'.repeat(21_000_000)
      const response = await fetch('/api/analyze-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: largeImage })
      })

      expect(response.status).toBe(400)
    })
  })
})
```

## Performance Testing

### Load Testing

```bash
# Simple load test with Apache Bench
ab -n 1000 -c 100 http://localhost:3000/api/gov-schemes

# With curl loop
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/predict-yield \
    -H "Content-Type: application/json" \
    -d '{"crop_name":"Wheat","sensor":{"moisture":50}}'
done
```

### Monitoring Performance

```typescript
const monitor = new PerformanceMonitor()

for (let i = 0; i < 100; i++) {
  await monitor.measure('api_call', async () => {
    return fetch('/api/analyze-crop')
  })
}

const stats = monitor.getStats('api_call')
console.log(`Average: ${stats.avg}ms`)
console.log(`P95: ${stats.p95}ms`)
console.log(`P99: ${stats.p99}ms`)
```

## CI/CD Testing Pipeline

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v2
        with:
          files: ./coverage/lcov.info
```

## Quality Metrics

### Code Quality Checklist

- [ ] All tests passing
- [ ] Coverage > 85%
- [ ] No critical vulnerabilities
- [ ] All linting errors fixed
- [ ] No hardcoded secrets
- [ ] Error handling in all paths
- [ ] Proper type annotations
- [ ] Comprehensive JSDoc comments

### Performance Benchmarks

| Operation | Target | Current |
|-----------|--------|---------|
| Crop analysis | < 5s | - |
| Yield prediction | < 3s | - |
| Gov schemes fetch | < 1s | - |
| Image validation | < 100ms | - |

## Debugging Tests

### Debug Single Test

```bash
node --inspect-brk node_modules/.bin/jest security-validation.test.ts
```

### Using Jest Debug

```typescript
it('should debug this', () => {
  debugger // Add breakpoint
  const result = functionUnderTest(input)
  expect(result).toBeDefined()
})
```

## Test Maintenance

### Keeping Tests Updated

1. Update tests when changing function signatures
2. Add tests for bug fixes (regression tests)
3. Review test coverage monthly
4. Remove obsolete tests
5. Keep test data realistic

### Test Refactoring

```typescript
// Before: Repeated test setup
it('test 1', () => {
  const obj = new MyClass()
  // ... test
})

it('test 2', () => {
  const obj = new MyClass()
  // ... test
})

// After: Using beforeEach
beforeEach(() => {
  this.obj = new MyClass()
})

it('test 1', () => {
  // ... test with this.obj
})

it('test 2', () => {
  // ... test with this.obj
})
```
