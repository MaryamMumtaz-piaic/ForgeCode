import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { ensureAbsolute } from '../utils/path.js';

const schema = z.object({
  path: z.string().min(1),
  content: z.string().optional().default(''),
  createDirectories: z.boolean().optional().default(false),
});

type Input = z.infer<typeof schema>;

export const createFileTool = {
  name: 'filesystem.createFile',
  description: 'Create a new file. Fails if the file already exists.',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input) {
    const start = Date.now();
    try {
      const absPath = ensureAbsolute(input.path);
      if (input.createDirectories) {
        await fs.mkdir(path.dirname(absPath), { recursive: true });
      }
      // wx flag = exclusive create — fails if file exists
      const fh = await fs.open(absPath, 'wx');
      await fh.writeFile(input.content, 'utf8');
      await fh.close();
      return {
        success: true,
        output: { path: absPath, created: true, bytes: Buffer.byteLength(input.content) },
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
