import { expect, test } from '@playwright/test';
import { openCommandPalette, skipOnboarding } from './helpers';

test('changes theme and persists it locally', async ({ page }) => {
  await page.goto('/');
  await skipOnboarding(page);
  await openCommandPalette(page);
  await page.getByRole('textbox', { name: 'Command palette search' }).fill('settings');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByRole('dialog', { name: 'ECHO settings' })).toBeVisible();

  await page.getByRole('tablist', { name: 'Theme' }).getByRole('tab', { name: 'Graphite' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'graphite');
  await page.getByRole('tablist', { name: 'Accent' }).getByRole('tab', { name: 'Violet' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'violet');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'graphite');
  await expect(page.locator('html')).toHaveAttribute('data-accent', 'violet');
});

test('toggles reduced motion from settings', async ({ page }) => {
  await page.goto('/');
  await skipOnboarding(page);
  await openCommandPalette(page);
  await page.getByRole('textbox', { name: 'Command palette search' }).fill('settings');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('switch', { name: 'Reduced motion' }).click();
  await expect(page.locator('html')).toHaveClass(/echo-reduce-motion/);
});
