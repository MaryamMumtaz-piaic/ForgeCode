import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { ensureAbsolute } from '../utils/path.js';

const schema = z.object({
  path: z.string().min(1),
  content: z.string(),
  encoding: z.enum(['utf8', 'base64']).optional().default('utf8'),
  createDirectories: z.boolean().optional().default(false),
});

type Input = z.infer<typeof schema>;

export const writeTool = {
  name: 'filesystem.write',
  description: 'Write content to a file, overwriting if it exists',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input) {
    const start = Date.now();
    try {
      const absPath = ensureAbsolute(input.path);
      if (input.createDirectories) {
        await fs.mkdir(path.dirname(absPath), { recursive: true });
      }
      const buf =
        input.encoding === 'base64'
          ? Buffer.from(input.content, 'base64')
          : Buffer.from(input.content, 'utf8');
      await fs.writeFile(absPath, buf);
      return {
        success: true,
        output: { path: absPath, bytesWritten: buf.length },
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
