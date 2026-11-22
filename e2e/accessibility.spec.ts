import { expect, test } from '@playwright/test';
import { nodeCount, skipOnboarding } from './helpers';

test('supports keyboard creation and undo outside inputs', async ({ page }) => {
  await page.goto('/');
  await skipOnboarding(page);
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  const before = await nodeCount(page);
  await page.keyboard.press('n');
  await expect.poll(() => nodeCount(page)).toBe(before + 1);
  await page.keyboard.press('Control+z');
  await expect.poll(() => nodeCount(page)).toBe(before);
});

test('opens and dismisses a context menu with the keyboard', async ({ page }) => {
  await page.goto('/');
  await skipOnboarding(page);
  const viewport = page.getByRole('region', { name: 'Knowledge graph viewport' });
  await viewport.click({ button: 'right', position: { x: 40, y: 120 } });
  await expect(page.getByRole('menu')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);
});

test('exposes labelled primary controls', async ({ page }) => {
  await page.goto('/');
  await skipOnboarding(page);
  for (const name of ['Search knowledge', 'Command palette (Ctrl+K)', 'Create node (N)', 'Graph layout']) {
    await expect(page.getByLabel(name).first()).toBeVisible();
  }
});
