import { expect, test } from '@playwright/test';
import { skipOnboarding } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await skipOnboarding(page);
});

test('switches between all visualization modes', async ({ page }) => {
  const views = [
    { label: '2D Graph', check: () => expect(page.locator('canvas')).toHaveCount(1) },
    { label: 'Radial Explorer', check: () => expect(page.getByText(/Center:/)).toBeVisible() },
    { label: 'Hierarchy', check: () => expect(page.locator('svg path')).not.toHaveCount(0) },
    { label: 'Clusters', check: () => expect(page.getByText('Knowledge clusters')).toBeVisible() },
    { label: 'Timeline', check: () => expect(page.getByText('Knowledge timeline')).toBeVisible() },
    { label: 'Table', check: () => expect(page.locator('tbody tr').first()).toBeVisible() },
    { label: 'Network Overview', check: () => expect(page.getByText('Network overview')).toBeVisible() },
    { label: '3D Universe', check: () => expect(page.locator('canvas')).toHaveCount(1) },
  ];

  for (const view of views) {
    await page.getByRole('button', { name: view.label, exact: true }).click();
    await view.check();
  }
});

test('applies a deterministic layout from the controls', async ({ page }) => {
  const layout = page.getByRole('combobox', { name: 'Graph layout' });
  await layout.selectOption('grid');
  await expect(layout).toHaveValue('grid');
  await expect(page.getByRole('button', { name: 'Pause simulation' })).toHaveCount(0);
  await layout.selectOption('force');
  await expect(page.getByRole('button', { name: 'Pause simulation' })).toBeVisible();
});
