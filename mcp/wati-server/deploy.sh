#!/bin/bash
# WATI MCP Server — Deploy script for Hostinger VPS
# Run this on your Hostinger VPS via SSH

set -e

echo "=== WATI MCP Server Deploy ==="

# 1. Create directory
mkdir -p ~/wati-mcp && cd ~/wati-mcp

# 2. Copy files (already uploaded via scp or pasted)
echo "Installing dependencies..."
npm install 2>&1 | tail -3

# 3. Create .env
if [ ! -f .env ]; then
  cat > .env << 'ENVEOF'
WATI_API_URL=https://live-mt-server.wati.io/102586
WATI_API_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImdhbG1pbGxlcjY5QGdtYWlsLmNvbSIsIm5hbWVpZCI6ImdhbG1pbGxlcjY5QGdtYWlsLmNvbSIsImVtYWlsIjoiZ2FsbWlsbGVyNjlAZ21haWwuY29tIiwiYXV0aF90aW1lIjoiMDMvMDkvMjAyNiAyMjozMToxNCIsInRlbmFudF9pZCI6IjEwMjU4NiIsImRiX25hbWUiOiJtdC1wcm9kLVRlbmFudHMiLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJBRE1JTklTVFJBVE9SIiwiZXhwIjoyNTM0MDIzMDA4MDAsImlzcyI6IkNsYXJlX0FJIiwiYXVkIjoiQ2xhcmVfQUkifQ.yneQRQ5CO-5QK2ZBD7VgaP9SYKlAf8z3k2JK9saARLI
PORT=3100
MCP_AUTH_SECRET=gam-wati-mcp-2026
ENVEOF
  echo "Created .env"
fi

# 4. Build
echo "Building..."
npx tsc 2>&1

# 5. Start with PM2
if command -v pm2 &> /dev/null; then
  pm2 delete wati-mcp 2>/dev/null || true
  pm2 start ecosystem.config.cjs --env production
  pm2 save
  echo "Started with PM2"
else
  echo "PM2 not found. Installing..."
  npm install -g pm2
  pm2 start ecosystem.config.cjs --env production
  pm2 save
  pm2 startup
fi

echo ""
echo "=== Done! ==="
echo "Health: curl http://localhost:3100/health"
echo "SSE:    http://localhost:3100/sse"
