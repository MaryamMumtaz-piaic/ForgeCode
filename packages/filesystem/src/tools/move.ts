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

export const moveTool = {
  name: 'filesystem.move',
  description: 'Move or rename a file or directory to a new location',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input) {
    const start = Date.now();
    try {
      const src = ensureAbsolute(input.source);
      const dest = ensureAbsolute(input.destination);

      if (!input.overwrite) {
        try {
          await fs.access(dest);
          return {
            success: false,
            error: `Destination already exists: ${dest}. Set overwrite: true to replace it.`,
            duration: Date.now() - start,
          };
        } catch {
          // destination doesn't exist — good
        }
      }

      await fs.mkdir(path.dirname(dest), { recursive: true });
      try {
        await fs.rename(src, dest);
      } catch {
        // Cross-drive move: copy then delete
        await fs.copyFile(src, dest);
        await fs.rm(src, { recursive: true, force: true });
      }

      return {
        success: true,
        output: { source: src, destination: dest },
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
