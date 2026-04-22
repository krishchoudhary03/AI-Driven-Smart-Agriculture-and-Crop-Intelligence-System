DEPLOYMENT_CHECKLIST.md

# Pre-Production Deployment Checklist

## Environment Variables
- [ ] All required env vars documented in .env.example
- [ ] lib/env.ts validates startup
- [ ] Secrets not in git (check .gitignore)
- [ ] Production secrets in Vercel/AWS Secrets Manager
- [ ] NEXT_PUBLIC_SUPABASE_URL set
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY set
- [ ] At least one GEMINI_API_KEY set
- [ ] NODE_ENV=production for production

## Database
- [ ] RLS (Row Level Security) enabled in Supabase
- [ ] Run migration: migrations/001_audit_tables.sql
- [ ] audit_logs table created
- [ ] login_attempts table created
- [ ] Backups configured (Supabase automated backups)
- [ ] Connection pooling tested

## Security
- [ ] HTTPS enforced
- [ ] CORS origins whitelist updated
- [ ] CSRF token generation tested (/api/csrf-token)
- [ ] Rate limiting tested at scale
- [ ] Security headers verified (X-Frame-Options, CSP, etc.)
- [ ] All 257 tests passing (pnpm test)

## Monitoring & Logging
- [ ] Structured logging configured (lib/logger.ts active)
- [ ] Health check endpoint working (GET /api/health)
- [ ] Error tracking enabled (Sentry/DataDog optional)
- [ ] Alerts configured for failures
- [ ] Log retention policy set

## Performance
- [ ] Caching headers optimized (next.config.mjs)
- [ ] Images compressed & optimized
- [ ] API response times < 1s
- [ ] Database queries < 100ms
- [ ] Lighthouse score > 90
- [ ] Bundle size acceptable

## API Features
- [ ] API versioning configured (X-API-Version header support)
- [ ] Webhook signing implemented (lib/request-signing.ts)
- [ ] Rate limiting active (checkRateLimitRedis)
- [ ] Request signing secret set

## Documentation
- [ ] API docs up to date
- [ ] Deployment guide reviewed
- [ ] Runbook for incidents created
- [ ] Architecture diagram updated
- [ ] .env.example documented

## Final Pre-Deployment
```bash
# Run security audit
pnpm security:audit

# Run all tests
pnpm test

# Build production
pnpm build

# Check for TypeScript errors (no more ignoreBuildErrors)
pnpm build

# Performance test
pnpm test:coverage
```

## Post-Deployment Monitoring
- [ ] Monitor error rates
- [ ] Monitor response times
- [ ] Monitor database connections
- [ ] Monitor rate limiting metrics
- [ ] Check audit logs for suspicious activity
