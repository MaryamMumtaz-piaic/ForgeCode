import { z } from 'zod';
import { getBrowser } from '../manager.js';

const schema = z.object({
  url: z.string().url(),
  waitForSelector: z.string().optional(),
  timeout: z.number().int().positive().max(30_000).optional().default(15_000),
  returnContent: z.enum(['text', 'html', 'both']).optional().default('text'),
});

type Input = z.infer<typeof schema>;

export const browserNavigateTool = {
  name: 'browser.navigate',
  description: 'Open a URL in a headless browser and return the page content',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input) {
    const start = Date.now();
    let page = null;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      await page.goto(input.url, { timeout: input.timeout, waitUntil: 'domcontentloaded' });
      if (input.waitForSelector) {
        await page.waitForSelector(input.waitForSelector, { timeout: input.timeout });
      }
      const title = await page.title();
      const text = input.returnContent !== 'html' ? await page.innerText('body').catch(() => '') : '';
      const html = input.returnContent !== 'text' ? await page.content().catch(() => '') : '';
      return {
        success: true,
        output: { url: input.url, title, text, html, duration: Date.now() - start },
        duration: Date.now() - start,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), duration: Date.now() - start };
    } finally {
      await page?.close().catch(() => {});
    }
  },
};
