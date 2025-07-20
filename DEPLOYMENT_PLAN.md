# Dominican Republic RFP Portal - Production Deployment Plan

## Pre-deployment Checklist

### 1. Application Testing Status
- ✅ Application builds successfully (`npm run build`)
- ✅ Frontend components are functional
- ✅ Supabase integration is configured
- ✅ No critical console errors in build

### 2. Database Verification 🔍
**Critical Step - Must be completed before deployment**

#### 2.1 Migration Status Check
- [ ] **Verify all migrations applied**: Check that all SQL migrations in `/supabase/migrations/` have been applied to production Supabase instance
- [ ] **Migration history review**: Confirm migration order and dependencies are correct
- [ ] **Rollback plan ready**: Ensure rollback scripts are available if needed

#### 2.2 Database Connection Verification
- [ ] **Environment variables**: Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set correctly for production
- [ ] **Connection test**: Test database connectivity from application
- [ ] **API endpoint verification**: Confirm Supabase API endpoints are accessible

#### 2.3 Schema Integrity Check
```sql
-- Verify key tables exist and have correct structure
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'procurement_releases',
  'procurement_parties', 
  'procurement_documents',
  'user_profiles',
  'user_alerts',
  'user_bookmarks'
);

-- Check Row Level Security is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;
```

#### 2.4 Data Integrity Verification
- [ ] **Sample data check**: Verify sample records exist in `procurement_releases`
- [ ] **Data consistency**: Check foreign key relationships are intact
- [ ] **Index performance**: Verify search indexes are functioning correctly

#### 2.5 Security Configuration
- [ ] **RLS Policies Active**: Confirm Row Level Security policies are enabled on all user tables
- [ ] **Authentication flow**: Test user registration/login functionality
- [ ] **Permission boundaries**: Verify users can only access their own data

#### 2.6 Database Performance
- [ ] **Query performance**: Test key search queries respond within acceptable time limits (<2 seconds)
- [ ] **Connection pooling**: Verify Supabase connection limits are appropriate for expected load
- [ ] **Backup verification**: Confirm automated backups are configured and functioning

### 3. Environment Configuration
- ✅ Supabase environment variables are set
- ✅ Build configuration is optimized for production
- ✅ All dependencies are resolved

### 4. Deployment Readiness
- ✅ Static build artifacts ready in `dist` directory
- ✅ No server-side components (pure frontend deployment)
- ✅ Netlify deployment provider available

## Deployment Process

### Target Environment Details
- **Platform**: Netlify Static Hosting
- **Application Type**: React SPA with Supabase backend
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### Deployment Steps
1. **Build Verification**: Ensure clean production build completes successfully
2. **Database Final Check**: Execute database verification checklist above
3. **Deploy to Netlify**: Push build artifacts to production
4. **Environment Variables**: Configure production environment variables in Netlify
5. **Custom Domain**: Configure custom domain if applicable

## Post-deployment Verification

### 1. Application Health Checks
- [ ] **Homepage loads**: Verify main application loads without errors
- [ ] **Search functionality**: Test procurement opportunity search
- [ ] **User authentication**: Verify login/logout flow works
- [ ] **Data sync**: Test data ingestion from DGCP API

### 2. Database Connectivity
- [ ] **Live data access**: Confirm application can read/write to production database
- [ ] **Search performance**: Verify search queries perform adequately under load
- [ ] **User data isolation**: Test that user-specific data (alerts, bookmarks) is properly isolated

### 3. Critical User Flows
- [ ] **Opportunity search**: Test search with various filters
- [ ] **Opportunity details**: Verify opportunity detail modal displays correctly
- [ ] **User registration**: Test new user signup process
- [ ] **Alert creation**: Test alert creation and management
- [ ] **Data export**: Verify CSV export functionality

### 4. Performance Monitoring
- [ ] **Page load times**: Monitor initial page load performance
- [ ] **API response times**: Monitor Supabase query performance
- [ ] **Error rates**: Check for any runtime errors in browser console

## Rollback Procedures

### If Database Issues Detected
1. **Immediate**: Switch application to read-only mode
2. **Restore**: Apply database rollback scripts if available
3. **Revert**: Roll back to previous known-good migration state
4. **Verify**: Test application functionality with rolled-back database

### If Application Issues Detected
1. **Immediate**: Revert to previous Netlify deployment
2. **Investigate**: Review browser console errors and application logs
3. **Fix**: Address issues in development environment
4. **Redeploy**: Follow full deployment process again

## Emergency Contacts & Resources
- **Supabase Dashboard**: [Production Supabase Project URL]
- **Netlify Dashboard**: [Production Netlify Site URL]
- **DGCP API Documentation**: https://api.dgcp.gob.do/
- **Deployment Lead**: [Contact Information]

---

**Note**: This deployment plan must be followed sequentially. Do not proceed to the next step until the current step is completely verified and signed off.