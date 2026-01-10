# Zero Waste Frankfurt - Launch Checklist

Use this checklist before deploying to production.

## Pre-Launch Verification

### Code Quality
- [x] All unit tests passing (126/126)
- [ ] E2E tests executed and passing
- [x] Build successful
- [x] No console errors in dev mode
- [x] TypeScript compilation (production build works)

### Features Complete
- [x] Map displays locations
- [x] Clustering works
- [x] Category filtering
- [x] Search functionality
- [x] Near me / geolocation
- [x] Location detail pages
- [x] Location submission form
- [x] Email verification
- [x] Admin login
- [x] Admin moderation panel
- [x] Favorites (localStorage)
- [x] i18n (DE/EN)
- [x] 404 page
- [x] Error boundary

### SEO & Performance
- [x] Meta tags on all pages
- [x] Open Graph tags
- [x] robots.txt created
- [x] sitemap.xml created
- [x] Lazy loading implemented
- [ ] Lighthouse audit run (>90 all metrics)

### Infrastructure
- [x] Supabase project created
- [x] Database schema deployed
- [x] Edge functions deployed
- [x] RLS policies configured
- [x] AWS CDK stack ready
- [x] CloudFront distribution configured
- [x] Custom domain configured
- [x] HTTPS certificate

### CI/CD
- [x] GitHub Actions workflows
- [x] CI pipeline (test on PR)
- [x] CD pipeline (deploy on merge)
- [ ] E2E tests in CI (optional)

### Environment
- [ ] Production .env configured
- [ ] Supabase keys updated
- [ ] Email service configured (Resend/Postmark)
- [ ] Admin user created in Supabase Auth

### Data
- [ ] Categories seeded (17 categories)
- [ ] Sample locations added
- [ ] All 200+ locations imported from Google My Maps
- [ ] Geocoding verified

### Security
- [ ] API keys secured (not committed)
- [ ] RLS policies tested
- [ ] Admin routes protected
- [ ] CORS configured correctly
- [ ] Rate limiting on Edge Functions

### Documentation
- [x] README.md
- [x] Deployment guide
- [x] E2E testing guide
- [x] Phase 7 summary
- [ ] User guide (optional)

### Testing in Production
- [ ] Visit homepage → map loads
- [ ] Click marker → popup shows
- [ ] Filter by category → works
- [ ] Search for location → works
- [ ] Click "Near Me" → requests permission
- [ ] Click location → detail page loads
- [ ] Submit new location → email received
- [ ] Verify email → location pending
- [ ] Admin login → dashboard loads
- [ ] Approve location → appears on map
- [ ] Add favorite → persists after reload
- [ ] Switch language → UI updates
- [ ] Visit invalid URL → 404 page shows

### Analytics & Monitoring (Post-Launch)
- [ ] Analytics installed (Plausible/Fathom)
- [ ] Error tracking (Sentry) - optional
- [ ] Uptime monitoring
- [ ] Performance monitoring

### Communication
- [ ] Social media announcement prepared
- [ ] Newsletter announcement
- [ ] Press release (if applicable)
- [ ] Community announcement

## Commands to Run

### Before Deploy
```bash
# 1. Run all tests
npm run test

# 2. Build for production
npm run build

# 3. Preview production build
npm run preview

# 4. Run E2E tests (manual)
npm run test:e2e

# 5. Type check (optional, minor errors OK)
npm run type-check
```

### Deploy
```bash
# From infra directory
cd infra
npm run deploy
```

### Post-Deploy
```bash
# Check CloudFront invalidation status
aws cloudfront list-invalidations --distribution-id <DIST_ID>

# Test production site
curl -I https://map.zerowastefrankfurt.de
```

## Emergency Rollback Plan

If something breaks in production:

1. **Immediate:** Revert CloudFront to previous S3 version
   ```bash
   # Copy previous dist to S3
   aws s3 sync s3://bucket-name/backup/ s3://bucket-name/ --delete

   # Invalidate cache
   aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
   ```

2. **Git:** Revert last commit
   ```bash
   git revert HEAD
   git push origin main
   # Wait for CI/CD to redeploy
   ```

3. **Database:** No DB changes in Phase 7, so no rollback needed

## Post-Launch Monitoring

### First 24 Hours
- [ ] Check error logs (CloudWatch)
- [ ] Monitor traffic (Analytics)
- [ ] Test all features manually
- [ ] Check Supabase usage
- [ ] Monitor Edge Function errors

### First Week
- [ ] Gather user feedback
- [ ] Check for bugs
- [ ] Review performance metrics
- [ ] Check SEO indexing status

### First Month
- [ ] Run Lighthouse audit
- [ ] Review analytics data
- [ ] Plan improvements based on usage

## Support Contacts

- **Supabase:** https://supabase.com/dashboard
- **AWS Console:** https://console.aws.amazon.com
- **GitHub:** https://github.com/your-repo
- **Domain:** (your domain registrar)

## Known Limitations

1. E2E tests not in CI (run manually)
2. Sitemap is static (not dynamic from DB)
3. No offline support (PWA)
4. No real-time updates
5. No user accounts (email verification only)

These are acceptable for MVP launch.

---

## Final Go/No-Go Decision

**Ready to launch if:**
- ✅ All unit tests pass
- ✅ Build successful
- ✅ Production environment configured
- ✅ Data imported
- ✅ Manual testing complete

**DO NOT launch if:**
- ❌ Tests failing
- ❌ Build errors
- ❌ Critical features broken
- ❌ Security issues found

---

**When all items checked: LAUNCH! 🚀**

Good luck with the launch!
