import { shellExecuteTool } from './tools/execute.js';

export * from './types.js';
export * from './executor.js';
export * from './danger.js';
export { shellExecuteTool } from './tools/execute.js';

export function getAllShellTools() {
  return [shellExecuteTool];
}
