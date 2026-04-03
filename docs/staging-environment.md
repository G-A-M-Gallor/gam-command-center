# GAM Command Center - Staging Environment Setup Guide

## 🎯 Overview

This guide sets up a complete staging environment for GAM Command Center (vBrain.io) that mirrors production but with isolated data and reduced resource usage.

## 📋 Prerequisites

- [ ] Supabase CLI installed: `npm install -g supabase`
- [ ] Vercel CLI installed: `npm install -g vercel`
- [ ] Access to GAM Command Center repository
- [ ] Supabase account with project creation permissions
- [ ] Vercel account with deployment permissions

## 🏗️ Setup Process

### **Step 1: Create Staging Supabase Project**

1. **Create New Project**
   ```bash
   # Login to Supabase
   npx supabase login

   # Create staging project
   npx supabase projects create gam-staging --plan free
   ```

2. **Get Project Details**
   ```bash
   # List projects to get staging project ref
   npx supabase projects list

   # Get API keys
   npx supabase projects api-keys --project-ref [staging-ref]
   ```

3. **Apply Database Schema**
   ```bash
   # Apply all migrations to staging
   npx supabase db push --project-ref [staging-ref]
   ```

### **Step 2: Configure Staging Environment**

1. **Create Environment File**
   ```bash
   # Copy template
   cp .env.staging.example .env.staging

   # Edit with staging values
   nano .env.staging
   ```

2. **Required Configuration Updates**
   ```bash
   # Update these keys in .env.staging:
   NEXT_PUBLIC_SUPABASE_URL="https://[staging-ref].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[staging-anon-key]"
   SUPABASE_SERVICE_ROLE_KEY="[staging-service-role-key]"
   SUPABASE_JWT_SECRET="[staging-jwt-secret]"
   ```

### **Step 3: Create Staging Vercel Project**

1. **Link to Staging Project**
   ```bash
   # Create new Vercel project for staging
   vercel --scope vbrain-team

   # Configure project name: vbrain-staging
   ```

2. **Set Environment Variables**
   ```bash
   # Upload staging environment variables
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   # ... (copy all from .env.staging)
   ```

### **Step 4: Deploy Staging Environment**

1. **Run Automated Deployment**
   ```bash
   ./scripts/staging-deploy.sh
   ```

2. **Manual Deployment (Alternative)**
   ```bash
   # Deploy Supabase functions
   npx supabase functions deploy --project-ref [staging-ref]

   # Deploy to Vercel
   vercel deploy --env-file=.env.staging
   ```

## 🔧 Staging vs Production Differences

| Component | Production | Staging | Notes |
|-----------|------------|---------|-------|
| **Cron Frequency** | Every 5min | Every 10min | Reduced load |
| **Backup Schedule** | 23:23 UTC | 02:00 UTC | Different timing |
| **Database** | Full data | Test data | Isolated environment |
| **Domain** | vbrain.io | vbrain-staging.vercel.app | Staging subdomain |
| **Logging** | Info level | Debug level | Enhanced debugging |
| **Rate Limits** | Production | Relaxed | Testing flexibility |

## 📊 Staging Environment Features

### **🔍 Debug Mode**
- Enhanced logging and error reporting
- Performance monitoring
- Debug panels in UI
- SQL query logging

### **🧪 Test Data**
- Isolated staging database
- Test user accounts
- Sample data sets
- No production data mixing

### **🚀 Deployment Pipeline**
- Automated staging deployment
- Integration with main branch
- Preview deployments for PRs
- Staging-to-production promotion

### **🔒 Security Configuration**
- Staging-specific API keys
- Reduced security strictness for testing
- Test webhook endpoints
- Staging banner warnings

## 🛠️ Daily Usage

### **Deploy to Staging**
```bash
# Quick deployment
./scripts/staging-deploy.sh

# Deploy specific function
npx supabase functions deploy notion-sync --project-ref [staging-ref]
```

### **Database Operations**
```bash
# Reset staging database
npx supabase db reset --project-ref [staging-ref]

# Apply new migrations
npx supabase db push --project-ref [staging-ref]

# Backup staging data
npx supabase db dump --project-ref [staging-ref] --data-only
```

### **Monitoring & Logs**
```bash
# View function logs
npx supabase functions logs --project-ref [staging-ref]

# Monitor deployment
vercel logs vbrain-staging
```

## 🚨 Troubleshooting

### **Common Issues**

1. **Environment Variables Not Loading**
   ```bash
   # Verify .env.staging exists and is valid
   cat .env.staging | grep SUPABASE_URL

   # Reload environment
   source .env.staging
   ```

2. **Database Connection Issues**
   ```bash
   # Test Supabase connection
   npx supabase projects api-keys --project-ref [staging-ref]

   # Verify RLS policies
   npx supabase db query "SELECT * FROM auth.users LIMIT 1" --project-ref [staging-ref]
   ```

3. **Function Deployment Failures**
   ```bash
   # Check function logs
   npx supabase functions logs [function-name] --project-ref [staging-ref]

   # Redeploy specific function
   npx supabase functions deploy [function-name] --project-ref [staging-ref] --debug
   ```

## 🔄 Staging to Production Workflow

1. **Testing in Staging**
   - Deploy feature branches to staging
   - Run automated tests
   - Manual QA validation
   - Performance testing

2. **Promotion Process**
   - Merge to main branch
   - Automated production deployment
   - Database migrations
   - Post-deployment verification

## 📈 Monitoring & Metrics

### **Health Checks**
- `/api/health` - Basic health status
- `/api/health/db` - Database connectivity
- `/api/health/functions` - Edge function status

### **Performance Metrics**
- Response times
- Database query performance
- Function execution times
- Error rates

## 🔐 Security Considerations

- **API Keys**: Use staging-specific keys
- **Data Privacy**: No production data in staging
- **Access Control**: Limited team access
- **CORS**: Staging-specific origins
- **Rate Limiting**: Relaxed for testing

## 📚 Next Steps

After successful staging setup:

1. [ ] Configure CI/CD pipeline
2. [ ] Set up automated testing
3. [ ] Create staging data seeds
4. [ ] Document staging workflows
5. [ ] Train team on staging usage