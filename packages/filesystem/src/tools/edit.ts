import fs from 'fs/promises';
import { z } from 'zod';
import { ensureAbsolute } from '../utils/path.js';

const schema = z.object({
  path: z.string().min(1),
  oldContent: z.string().min(1, 'oldContent cannot be empty'),
  newContent: z.string(),
});

type Input = z.infer<typeof schema>;

export const editTool = {
  name: 'filesystem.edit',
  description:
    'Replace an exact string in a file with new content (patch-based editing)',
  inputSchema: schema,
  permission: 'APPROVAL' as const,
  async execute(input: Input) {
    const start = Date.now();
    try {
      const absPath = ensureAbsolute(input.path);
      const original = await fs.readFile(absPath, 'utf8');

      if (!original.includes(input.oldContent)) {
        return {
          success: false,
          error: `oldContent not found in file. The file may have changed since you read it.`,
          duration: Date.now() - start,
        };
      }

      const updated = original.replace(input.oldContent, input.newContent);
      await fs.writeFile(absPath, updated, 'utf8');

      const oldLines = input.oldContent.split('\n');
      const newLines = input.newContent.split('\n');

      return {
        success: true,
        output: {
          path: absPath,
          linesRemoved: oldLines.length,
          linesAdded: newLines.length,
          diff: {
            removed: oldLines.map(l => `- ${l}`),
            added: newLines.map(l => `+ ${l}`),
          },
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
