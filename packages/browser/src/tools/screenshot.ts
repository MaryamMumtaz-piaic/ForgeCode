import { z } from 'zod';
import { getBrowser } from '../manager.js';
import path from 'path';

const schema = z.object({
  url: z.string().url(),
  outputPath: z.string().min(1).describe('Where to save the screenshot (.png)'),
  fullPage: z.boolean().optional().default(false),
  timeout: z.number().int().positive().max(30_000).optional().default(15_000),
});

type Input = z.infer<typeof schema>;

export const browserScreenshotTool = {
  name: 'browser.screenshot',
  description: 'Take a screenshot of a webpage and save it to disk',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input) {
    const start = Date.now();
    let page = null;
    try {
      const browser = await getBrowser();
      page = await browser.newPage();
      await page.goto(input.url, { timeout: input.timeout, waitUntil: 'domcontentloaded' });
      const outPath = path.resolve(input.outputPath);
      await page.screenshot({ path: outPath, fullPage: input.fullPage });
      return {
        success: true,
        output: { url: input.url, savedTo: outPath },
        duration: Date.now() - start,
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err), duration: Date.now() - start };
    } finally {
      await page?.close().catch(() => {});
    }
  },
};
