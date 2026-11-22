import type { Page } from '@playwright/test';

/** Dismiss the first-run tour without depending on modal animation stability. */
export async function skipOnboarding(page: Page): Promise<void> {
  const skip = page.getByRole('button', { name: 'Skip tour' });
  if (await skip.count()) {
    await page.evaluate(() => {
      const button = [...document.querySelectorAll('button')]
        .find((candidate) => candidate.textContent?.trim() === 'Skip tour');
      button?.click();
    });
    await skip.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => undefined);
  }
  await page.locator('footer').waitFor({ state: 'visible', timeout: 20_000 });
}

/** Open the command palette through its toolbar control. */
export async function openCommandPalette(page: Page): Promise<void> {
  await page.evaluate(() => {
    const button = [...document.querySelectorAll('button')]
      .find((candidate) => (candidate.getAttribute('aria-label') ?? '').includes('Command palette'));
    button?.click();
  });
  await page.getByRole('textbox', { name: 'Command palette search' }).waitFor({ state: 'visible' });
}

/** Read the node count from the status bar. */
export async function nodeCount(page: Page): Promise<number> {
  const footer = page.locator('footer');
  await footer.waitFor({ state: 'visible', timeout: 20_000 });
  const text = await footer.innerText();
  const match = text.match(/(\d+)\s+nodes/);
  return match ? Number(match[1]) : Number.NaN;
}
