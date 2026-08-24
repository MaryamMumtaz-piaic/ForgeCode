import { z } from 'zod';
import { getBrowser } from '../manager.js';

const schema = z.object({
  url: z.string().url(),
  selector: z.string().min(1).describe('CSS selector to click'),
  timeout: z.number().int().positive().max(15_000).optional().default(10_000),
  waitForNav: z.boolean().optional().default(false),
});

type Input = z.infer<typeof schema>;

export const browserClickTool = {
  name: 'browser.click',
  description: 'Click an element on a webpage identified by CSS selector',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input) {
    const start = Date.now();
    let page = null;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      await page.goto(input.url, { timeout: input.timeout });
      if (input.waitForNav) {
        await Promise.all([page.waitForNavigation({ timeout: input.timeout }), page.click(input.selector)]);
      } else {
        await page.click(input.selector, { timeout: input.timeout });
      }
      const newUrl = page.url();
      const title = await page.title();
      return { success: true, output: { clicked: input.selector, newUrl, title }, duration: Date.now() - start };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), duration: Date.now() - start };
    } finally {
      await page?.close().catch(() => {});
    }
  },
};
