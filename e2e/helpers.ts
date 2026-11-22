import type { Page } from '@playwright/test';

/** Dismiss the first-run tour so tests start from the working graph. */
export async function skipOnboarding(page: Page): Promise<void> {
  const skip = page.getByRole('button', { name: 'Skip tour' });
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

/** Open the command palette through its toolbar control. */
export async function openCommandPalette(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Command palette/ }).click();
}

/** Read the node count from the status bar. */
export async function nodeCount(page: Page): Promise<number> {
  const footer = await page.locator('footer').innerText();
  const match = footer.match(/(\d+)\s+nodes/);
  return match ? Number(match[1]) : Number.NaN;
}
