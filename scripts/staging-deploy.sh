#!/bin/bash
# GAM Command Center - Staging Deployment Script
# Usage: ./scripts/staging-deploy.sh

set -e

echo "🚀 GAM Command Center - Staging Deployment"
echo "==========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if staging environment file exists
if [ ! -f ".env.staging" ]; then
    echo -e "${RED}❌ .env.staging file not found${NC}"
    echo "Please copy .env.staging.example to .env.staging and configure with staging values"
    exit 1
fi

echo -e "${BLUE}📋 Pre-deployment Checklist${NC}"
echo "1. ✅ .env.staging configured"

# Check if required tools are installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found${NC}"
    echo "Install with: npm install -g vercel"
    exit 1
fi

if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install with: npm install -g supabase"
    exit 1
fi

echo "2. ✅ Required tools installed"

# Load staging environment variables
export $(grep -v '^#' .env.staging | xargs)

echo -e "${BLUE}🔧 Deploying to Staging Environment${NC}"
echo "Target URL: ${NEXT_PUBLIC_APP_URL}"

# Deploy Supabase functions to staging
if [ ! -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}📤 Deploying Supabase Edge Functions...${NC}"

    # Deploy all functions
    npx supabase functions deploy notion-sync --project-ref $(echo $NEXT_PUBLIC_SUPABASE_URL | grep -o '[^/]*\.supabase\.co' | cut -d'.' -f1)
    npx supabase functions deploy daily-backup --project-ref $(echo $NEXT_PUBLIC_SUPABASE_URL | grep -o '[^/]*\.supabase\.co' | cut -d'.' -f1)
    npx supabase functions deploy restore-backup --project-ref $(echo $NEXT_PUBLIC_SUPABASE_URL | grep -o '[^/]*\.supabase\.co' | cut -d'.' -f1)
    npx supabase functions deploy complete-tasks --project-ref $(echo $NEXT_PUBLIC_SUPABASE_URL | grep -o '[^/]*\.supabase\.co' | cut -d'.' -f1)

    echo -e "${GREEN}✅ Supabase functions deployed${NC}"
fi

# Deploy to Vercel staging
echo -e "${YELLOW}🚀 Deploying to Vercel...${NC}"

# Use staging-specific vercel.json
cp vercel.staging.json vercel.json

# Deploy to Vercel with staging environment
vercel deploy --env-file=.env.staging --confirm

# Restore original vercel.json
git checkout vercel.json

echo -e "${GREEN}✅ Staging deployment completed${NC}"
echo -e "${BLUE}🌐 Staging URL: ${NEXT_PUBLIC_APP_URL}${NC}"

# Run basic health checks
echo -e "${YELLOW}🔍 Running health checks...${NC}"

# Wait a bit for deployment to be ready
sleep 10

# Check if site is accessible
if curl -s --head "${NEXT_PUBLIC_APP_URL}" | head -n 1 | grep -q "200 OK"; then
    echo -e "${GREEN}✅ Site is accessible${NC}"
else
    echo -e "${RED}❌ Site health check failed${NC}"
    echo "Please check deployment logs"
fi

echo -e "${GREEN}🎉 Staging deployment process completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify staging environment at: ${NEXT_PUBLIC_APP_URL}"
echo "2. Run staging tests"
echo "3. Update staging DNS if needed"