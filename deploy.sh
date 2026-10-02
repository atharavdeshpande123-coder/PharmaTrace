#!/bin/bash
set -e

echo "=========================================="
echo "  PharmaTrace Vercel Deployment Script"
echo "=========================================="
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
  echo "Installing Vercel CLI..."
  npm install -g vercel
fi

# Login
echo "Step 1: Login to Vercel"
vercel login

# Deploy
echo ""
echo "Step 2: Deploy to Vercel"
vercel --yes

# Get deployment URL
DEPLOY_URL=$(vercel inspect $(vercel ls 2>&1 | head -5 | grep -o 'https://[a-z0-9-]*\.vercel\.app') --json 2>/dev/null | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

echo ""
echo "Step 3: Set Environment Variables"
echo "You need to set the following in Vercel Dashboard → Settings → Environment Variables:"
echo ""
echo "  DATABASE_URL=postgresql://your-connection-string"
echo "  JWT_SECRET=your-secret-key"
echo "  BLOCKCHAIN_MODE=local"
echo "  PUBLIC_APP_URL=https://your-app.vercel.app"
echo "  NODE_ENV=production"
echo ""

# Switch schema to PostgreSQL
echo "Step 4: Switch schema to PostgreSQL"
sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
echo "Done. Schema is now PostgreSQL."

# Push schema
echo "Step 5: Push schema to database"
echo "Enter your DATABASE_URL:"
read DB_URL
DATABASE_URL="$DB_URL" npx prisma db push --accept-data-loss

# Seed
echo "Step 6: Seed demo data"
DATABASE_URL="$DB_URL" npx tsx prisma/seed.ts

echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "Your app is live at: $DEPLOY_URL"
echo "Demo login: admin@pharmatrace.demo / demo1234"
echo ""
echo "Next: Set PUBLIC_APP_URL in Vercel env vars to $DEPLOY_URL"
echo "Then redeploy: vercel --prod"
