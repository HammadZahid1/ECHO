import { expect, test } from '@playwright/test';
import { nodeCount, skipOnboarding } from './helpers';

test('keeps graph edits after a full reload', async ({ page }) => {
  await page.goto('/');
  await skipOnboarding(page);
  const before = await nodeCount(page);
  await page.getByRole('button', { name: 'Create node (N)' }).click();
  await expect.poll(() => nodeCount(page)).toBe(before + 1);

  await page.reload();
  await skipOnboarding(page);
  await expect.poll(() => nodeCount(page)).toBe(before + 1);
  await expect(page.locator('footer')).toContainText('saved');
});

test('keeps onboarding completion after reload', async ({ page }) => {
  await page.goto('/');
  await skipOnboarding(page);
  await page.reload();
  await expect(page.getByRole('dialog', { name: /Welcome to ECHO/ })).toHaveCount(0);
});
