# Production Deployment Guide

This guide provides step-by-step instructions for deploying the Ullishtja Agroturizem application to production.

## Pre-Deployment Checklist

Before deploying to production, run our comprehensive production readiness check:

```bash
npm run production-check
```

This will verify:
- ✅ Environment variables are properly configured
- ✅ Build artifacts are present
- ✅ Security headers are configured
- ✅ Database schema is ready
- ✅ No test credentials in production

## Deployment Steps

### 1. Environment Setup

1. **Create production environment file**
   ```bash
   cp example.env .env.production
   ```

2. **Configure production variables** in `.env.production`:
   ```bash
   NODE_ENV=production
   DATABASE_URL=your_production_database_url
   CLERK_SECRET_KEY=your_production_clerk_secret
   REACT_APP_CLERK_PUBLISHABLE_KEY=your_production_clerk_public_key
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

3. **Validate environment**:
   ```bash
   NODE_ENV=production npm run validate-env
   ```

### 2. Database Migration

1. **Run production migrations**:
   ```bash
   npx prisma migrate deploy
   ```

2. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```

3. **Initialize restaurant settings** (first-time only):
   ```bash
   npm run init-settings
   ```

### 3. Build Application

1. **Install production dependencies**:
   ```bash
   npm ci --production=false
   ```

2. **Build the application**:
   ```bash
   npm run build
   ```

3. **Verify build**:
   ```bash
   ls -la build/
   ```

### 4. Vercel Deployment

#### Option A: Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

#### Option B: GitHub Integration

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Production deployment"
   git push origin main
   ```

2. **Configure environment variables in Vercel dashboard**:
   - Go to your project settings
   - Add all environment variables from `.env.production`
   - Deploy automatically triggers

### 5. Post-Deployment Verification

1. **Health check**:
   ```bash
   curl https://yourdomain.com/health
   ```

2. **API endpoints test**:
   ```bash
   curl https://yourdomain.com/api/menu/categories
   curl https://yourdomain.com/api/restaurant-settings
   ```

3. **Frontend verification**:
   - Visit https://yourdomain.com
   - Test reservation form
   - Verify menu display
   - Test admin login

### 6. Admin User Setup

1. **Create admin user** (production):
   ```bash
   ADMIN_EMAIL=admin@yourdomain.com ADMIN_PASSWORD=secure_password npm run create-admin-user
   ```

2. **Configure admin user IDs**:
   - Login to your app
   - Copy the Clerk user ID
   - Add to `REACT_APP_ADMIN_USER_IDS` environment variable

## Environment Variables Reference

### Required Production Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment type | `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `CLERK_SECRET_KEY` | Clerk backend secret | `sk_live_...` |
| `REACT_APP_CLERK_PUBLISHABLE_KEY` | Clerk frontend public key | `pk_live_...` |
| `ALLOWED_ORIGINS` | Allowed CORS origins | `https://yourdomain.com` |

### Optional Production Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `REACT_APP_ADMIN_USER_IDS` | Admin user IDs | None |
| `REACT_APP_GOOGLE_PLACE_ID` | Google Places ID | None |
| `REACT_APP_GOOGLE_PLACES_API_KEY` | Google Places API key | None |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | None |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | None |

## Security Configuration

### 1. HTTPS/SSL
- Vercel automatically provides SSL certificates
- Ensure all URLs use HTTPS in production
- Update `ALLOWED_ORIGINS` to use HTTPS

### 2. CORS Configuration
```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 3. Security Headers
The application automatically applies these security headers:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 4. Rate Limiting
Production rate limits:
- General API: 100 requests per 15 minutes
- Reservations: 5 requests per 15 minutes
- Authentication: 10 requests per 15 minutes

## Monitoring and Maintenance

### 1. Application Monitoring
- **Health Endpoint**: `https://yourdomain.com/health`
- **Uptime Monitoring**: Set up external monitoring service
- **Error Tracking**: Monitor application logs in Vercel dashboard

### 2. Database Monitoring
- Monitor connection pool usage
- Set up alerts for database performance
- Regular backup verification

### 3. Performance Monitoring
- Monitor Core Web Vitals
- Track API response times
- Monitor memory usage

## Troubleshooting

### Common Deployment Issues

1. **Environment Variables Not Loading**
   - Verify variables are set in Vercel dashboard
   - Check variable names match exactly
   - Restart deployment after adding variables

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check IP whitelist in database provider
   - Ensure SSL is enabled if required

3. **CORS Errors**
   - Add your domain to ALLOWED_ORIGINS
   - Verify HTTPS is used in production
   - Check browser developer tools for details

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are listed in package.json
   - Clear build cache and retry

### Rollback Procedure

1. **Immediate rollback via Vercel**:
   - Go to Vercel dashboard
   - Select previous deployment
   - Click "Promote to Production"

2. **Code rollback**:
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Database rollback** (if needed):
   ```bash
   npx prisma migrate reset
   npx prisma migrate deploy
   ```

## Performance Optimization

### 1. Database Optimization
- Connection pooling is pre-configured
- Indexes are defined in Prisma schema
- Query optimization is enabled

### 2. Asset Optimization
```bash
# Optimize images
npm run optimize-images

# Optimize videos
npm run optimize-videos
```

### 3. Caching Strategy
- Static assets cached by Vercel CDN
- API responses include appropriate cache headers
- Database queries use Prisma's built-in caching

## Backup and Recovery

### 1. Database Backups
- Configure automated backups with your database provider
- Test restore procedures regularly
- Document recovery time objectives (RTO)

### 2. Code Backups
- Code is backed up in Git repository
- Multiple deployment environments available
- Tagged releases for version control

## Support and Documentation

For additional support:
1. Check application logs in Vercel dashboard
2. Review environment variable configuration
3. Run production readiness check: `npm run production-check`
4. Refer to [Environment Setup Guide](./ENVIRONMENT_SETUP.md)

## Updates and Maintenance

### Regular Maintenance Tasks
- [ ] Update dependencies monthly
- [ ] Review security vulnerabilities
- [ ] Monitor performance metrics
- [ ] Test backup/restore procedures
- [ ] Update SSL certificates (automatic with Vercel)
- [ ] Review and rotate API keys quarterly

### Update Procedure
1. Test updates in staging environment
2. Run production readiness check
3. Deploy during low-traffic periods
4. Monitor application after deployment
5. Rollback if issues detected