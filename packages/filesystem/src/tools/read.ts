import fs from 'fs/promises';
import { z } from 'zod';
import { ensureAbsolute, isSensitivePath } from '../utils/path.js';

const schema = z.object({
  path: z.string().min(1),
  encoding: z.enum(['utf8', 'base64']).optional().default('utf8'),
  maxBytes: z.number().int().positive().max(10_000_000).optional(),
});

type Input = z.infer<typeof schema>;

export const readTool = {
  name: 'filesystem.read',
  description: 'Read the contents of a file',
  inputSchema: schema,
  permission: 'SAFE' as const,
  async execute(input: Input) {
    const start = Date.now();
    try {
      const absPath = ensureAbsolute(input.path);
      const stat = await fs.stat(absPath);

      const sensitive = isSensitivePath(absPath);
      let content: string;
      let truncated = false;

      if (input.maxBytes && stat.size > input.maxBytes) {
        const buf = Buffer.alloc(input.maxBytes);
        const fh = await fs.open(absPath, 'r');
        await fh.read(buf, 0, input.maxBytes, 0);
        await fh.close();
        content =
          input.encoding === 'base64'
            ? buf.toString('base64')
            : buf.toString('utf8');
        truncated = true;
      } else {
        const buf = await fs.readFile(absPath);
        content =
          input.encoding === 'base64'
            ? buf.toString('base64')
            : buf.toString('utf8');
      }

      return {
        success: true,
        output: {
          content,
          path: absPath,
          size: stat.size,
          encoding: input.encoding,
          truncated,
          sensitive,
        },
        duration: Date.now() - start,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        duration: Date.now() - start,
      };
    }
  },
};
