import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('GET /api/health returns healthy status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBeDefined();
    expect(body.timestamp).toBeDefined();
    expect(body.checks).toBeDefined();
    expect(body.checks.database).toBeDefined();
    expect(body.checks.auth).toBeDefined();
  });

  test('health check includes all service checks', async ({ request }) => {
    const response = await request.get('/api/health');
    const body = await response.json();

    const expectedChecks = ['database', 'auth', 'rls', 'write'];
    for (const check of expectedChecks) {
      expect(body.checks[check]).toBeDefined();
      expect(body.checks[check].latency).toBeGreaterThanOrEqual(0);
    }
  });
});
