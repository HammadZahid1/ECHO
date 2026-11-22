import { expect, test } from '@playwright/test';
import { skipOnboarding } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await skipOnboarding(page);
});

test('searches local knowledge and focuses a result', async ({ page }) => {
  await page.getByRole('button', { name: 'Search knowledge' }).click();
  const input = page.getByRole('textbox', { name: 'Search knowledge' });
  await input.fill('architecture');

  const result = page.locator('[data-testid="search-result"]').filter({ hasText: 'Software architecture' }).first();
  await expect(result).toBeVisible();
  await result.click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('shows an empty state for unknown terms', async ({ page }) => {
  await page.getByRole('button', { name: 'Search knowledge' }).click();
  const input = page.getByRole('textbox', { name: 'Search knowledge' });
  await input.fill('zzzznotfoundzzzz');
  await expect(page.getByRole('dialog')).toContainText(/no (results|matches)/i);
});
