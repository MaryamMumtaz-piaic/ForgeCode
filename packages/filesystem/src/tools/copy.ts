import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { ensureAbsolute } from '../utils/path.js';

const schema = z.object({
  source: z.string().min(1),
  destination: z.string().min(1),
  overwrite: z.boolean().optional().default(false),
});

type Input = z.infer<typeof schema>;

export const copyTool = {
  name: 'filesystem.copy',
  description: 'Copy a file to a new location',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input) {
    const start = Date.now();
    try {
      const src = ensureAbsolute(input.source);
      const dest = ensureAbsolute(input.destination);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      const flag = input.overwrite
        ? fs.constants.COPYFILE_FICLONE_FORCE
        : fs.constants.COPYFILE_EXCL;
      await fs.copyFile(src, dest, input.overwrite ? 0 : flag);
      const stat = await fs.stat(dest);
      return {
        success: true,
        output: { source: src, destination: dest, bytes: stat.size },
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
