import { listTool } from './tools/list.js';
import { readTool } from './tools/read.js';
import { writeTool } from './tools/write.js';
import { editTool } from './tools/edit.js';
import { searchTool } from './tools/search.js';
import { moveTool } from './tools/move.js';
import { copyTool } from './tools/copy.js';
import { renameTool } from './tools/rename.js';
import { deleteTool } from './tools/delete.js';
import { metadataTool } from './tools/metadata.js';
import { createDirectoryTool } from './tools/create-directory.js';
import { createFileTool } from './tools/create-file.js';
import { diskUsageTool } from './tools/disk-usage.js';

export * from './utils/path.js';
export * from './utils/timing.js';
export { listTool } from './tools/list.js';
export { readTool } from './tools/read.js';
export { writeTool } from './tools/write.js';
export { editTool } from './tools/edit.js';
export { searchTool } from './tools/search.js';
export { moveTool } from './tools/move.js';
export { copyTool } from './tools/copy.js';
export { renameTool } from './tools/rename.js';
export { deleteTool } from './tools/delete.js';
export { metadataTool } from './tools/metadata.js';
export { createDirectoryTool } from './tools/create-directory.js';
export { createFileTool } from './tools/create-file.js';
export { diskUsageTool } from './tools/disk-usage.js';

export function getAllFilesystemTools(): unknown[] {
  return [
    listTool,
    readTool,
    writeTool,
    editTool,
    searchTool,
    moveTool,
    copyTool,
    renameTool,
    deleteTool,
    metadataTool,
    createDirectoryTool,
    createFileTool,
    diskUsageTool,
  ];
}
