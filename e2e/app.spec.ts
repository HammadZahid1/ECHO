import { expect, test } from '@playwright/test';
import { nodeCount, openCommandPalette, skipOnboarding } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await skipOnboarding(page);
  await expect(page.getByRole('region', { name: 'Knowledge graph viewport' })).toBeVisible();
});

test('renders a local graph with saved status', async ({ page }) => {
  await expect(page.locator('footer')).toContainText('Local');
  await expect(page.locator('footer')).toContainText('nodes');
  expect(await nodeCount(page)).toBeGreaterThan(0);
});

test('creates a node and restores it with undo', async ({ page }) => {
  const before = await nodeCount(page);
  await page.getByRole('button', { name: 'Create node (N)' }).click();
  await expect.poll(() => nodeCount(page)).toBe(before + 1);
  await page.getByRole('button', { name: /Undo/ }).click();
  await expect.poll(() => nodeCount(page)).toBe(before);
});

test('opens the command palette and filters commands', async ({ page }) => {
  await openCommandPalette(page);
  const input = page.getByRole('textbox', { name: 'Command palette search' });
  await expect(input).toBeVisible();
  await input.fill('settings');
  await expect(page.getByRole('button', { name: 'Open settings' })).toBeVisible();
});

test('closes overlays with Escape', async ({ page }) => {
  await openCommandPalette(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
