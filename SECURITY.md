# Security Policy

## Row Level Security (RLS) Policies

Velox implements the following RLS policies in Supabase:

### Sessions Table
```sql
-- Users can only access their own sessions
CREATE POLICY "Users can view own sessions"
ON sessions FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own sessions
CREATE POLICY "Users can insert own sessions"
ON sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own sessions
CREATE POLICY "Users can update own sessions"
ON sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only delete their own sessions
CREATE POLICY "Users can delete own sessions"
ON sessions FOR DELETE
USING (auth.uid() = user_id);
```

### Profiles Table
```sql
-- Users can only view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

## Secrets Management

1. **Environment Variables**
   - All sensitive configuration is stored as environment variables
   - Never commit `.env` files to version control
   - Use `.env.example` for documentation

2. **Deployment Secrets**
   - Secrets are managed through Fly.io's secret management
   - GitHub Actions secrets for CI/CD
   - Supabase service role key is never exposed to the client

3. **API Keys**
   - Supabase anon key is public (required for client)
   - Service role key is private (server-side only)
   - API keys are rotated regularly

## Security Headers

Velox implements the following security headers:

- `Strict-Transport-Security`: Enforces HTTPS
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME type sniffing
- `X-XSS-Protection`: Basic XSS protection
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Restricts browser features

## Rate Limiting

- API endpoints are rate-limited to 100 requests per minute
- IP-based rate limiting for authentication endpoints
- Exponential backoff for failed requests

## Dependency Security

1. **Automated Scanning**
   - Dependabot for dependency updates
   - Trivy for container scanning
   - Weekly security scans

2. **Update Policy**
   - Critical updates are applied immediately
   - Regular updates are applied weekly
   - All updates require passing tests

## Reporting Vulnerabilities

If you discover a security vulnerability, please:

1. **Do not disclose it publicly**
2. Email security@velox.ai with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will:
- Acknowledge receipt within 24 hours
- Investigate and provide updates
- Credit you in our security advisory (if desired)

## Security Checklist

Before deploying:

- [ ] All dependencies are up to date
- [ ] Security headers are properly configured
- [ ] RLS policies are in place
- [ ] Rate limiting is enabled
- [ ] Secrets are properly managed
- [ ] Security tests are passing
- [ ] Container scan is clean 