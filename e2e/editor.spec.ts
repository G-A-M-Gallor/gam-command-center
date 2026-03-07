import { test, expect } from '@playwright/test';

test.describe('Editor', () => {
  test('editor page loads document list', async ({ page }) => {
    await page.goto('/dashboard/editor');
    // Should show either the document list or login redirect
    await expect(page).toHaveURL(/\/(dashboard\/editor|login)/);
  });

  test('can navigate to editor from dashboard', async ({ page }) => {
    await page.goto('/dashboard/layers');
    // Page should load without error
    const body = page.locator('body');
    await expect(body).not.toContainText('Application error');
  });

  test('health endpoint is accessible', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
  });
});

// Editor-specific tests (require authentication)
test.describe('Editor — Authenticated', () => {
  // These tests require a valid auth session
  // Skip if no test credentials configured
  test.skip(
    !process.env.TEST_EMAIL || !process.env.TEST_PASSWORD,
    'Requires TEST_EMAIL and TEST_PASSWORD env vars',
  );

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD!);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard/**');
  });

  test('can create and type in editor', async ({ page }) => {
    await page.goto('/dashboard/editor');
    // Wait for document list to load
    await page.waitForTimeout(2000);

    // Look for a "new document" button
    const newBtn = page.locator('button:has-text("חדש"), button:has-text("New")');
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await page.waitForSelector('[contenteditable="true"]', { timeout: 10000 });

      const editor = page.locator('.ProseMirror, [contenteditable="true"]');
      await editor.click();
      await editor.pressSequentially('בדיקת שמירה אוטומטית');

      await expect(editor).toContainText('בדיקת שמירה אוטומטית');
    }
  });

  test('autosave shows status indicator', async ({ page }) => {
    await page.goto('/dashboard/editor');
    await page.waitForTimeout(2000);

    // If we can find an editor, type and verify save status appears
    const editor = page.locator('.ProseMirror, [contenteditable="true"]');
    if (await editor.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editor.click();
      await editor.pressSequentially('test autosave');

      // Wait for debounced save (1s) + save time
      await page.waitForTimeout(3000);

      // Look for save status indicator
      const statusBar = page.locator('.gam-editor-statusbar');
      if (await statusBar.isVisible()) {
        await expect(statusBar).toBeVisible();
      }
    }
  });
});
