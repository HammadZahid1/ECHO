import { expect, test } from '@playwright/test';
import { nodeCount, skipOnboarding } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await skipOnboarding(page);
});

test('previews and merges pasted Markdown knowledge', async ({ page }) => {
  const before = await nodeCount(page);
  await page.getByRole('button', { name: 'Import knowledge' }).click();
  await expect(page.getByRole('dialog')).toContainText('Import knowledge');
  await page.getByRole('textbox', { name: 'CONTENT' }).fill('# Browser Test Node\n\nA locally imported concept.');
  await expect(page.getByRole('dialog')).toContainText('Detected format');
  await expect(page.getByRole('dialog')).toContainText('markdown');
  await page.getByRole('button', { name: 'Merge into current' }).click();
  await expect.poll(() => nodeCount(page)).toBeGreaterThan(before);
});

test('opens export with all local formats', async ({ page }) => {
  await page.getByRole('button', { name: 'Export knowledge' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('JSON');
  await expect(dialog).toContainText('CSV');
  await expect(dialog).toContainText('Markdown');
  await expect(dialog).toContainText('SVG');
  await expect(dialog).toContainText('PNG');
});
