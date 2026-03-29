import { NextRequest } from 'next/server';
import { getConfig, getContacts } from '@/lib/wati/client';

export async function GET(request: NextRequest) {
  const checks = {
    config: false,
    api_connection: false,
    mcp_server: false,
  };

  const errors: string[] = [];
  let status = 200;

  try {
    // 1. Check WATI configuration
    getConfig();
    checks.config = true;
  } catch (error) {
    errors.push(`Config: ${error}`);
    status = 500;
  }

  try {
    // 2. Check WATI API connection
    const contacts = await getContacts(1, 1); // Minimal request
    checks.api_connection = contacts !== undefined;
  } catch (error) {
    checks.api_connection = false;
    errors.push(`API: ${error}`);
    status = 500;
  }

  try {
    // 3. Check MCP server
    const response = await fetch('http://localhost:3000/api/health');
    checks.mcp_server = response.ok;
  } catch (error) {
    checks.mcp_server = false;
    errors.push(`MCP: ${error}`);
    status = 500;
  }

  const health = {
    status: status === 200 ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
    errors: errors.length > 0 ? errors : undefined,
    uptime: process.uptime(),
  };

  return Response.json(health, { status });
}