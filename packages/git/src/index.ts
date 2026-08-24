import { gitStatusTool } from './tools/status.js';
import { gitDiffTool } from './tools/diff.js';
import { gitLogTool } from './tools/log.js';
import { gitBranchTool } from './tools/branch.js';
import { gitAddTool } from './tools/add.js';
import { gitCommitTool } from './tools/commit.js';
import { gitCheckoutTool } from './tools/checkout.js';
import { gitStashTool } from './tools/stash.js';

export * from './runner.js';
export { gitStatusTool } from './tools/status.js';
export { gitDiffTool } from './tools/diff.js';
export { gitLogTool } from './tools/log.js';
export { gitBranchTool } from './tools/branch.js';
export { gitAddTool } from './tools/add.js';
export { gitCommitTool } from './tools/commit.js';
export { gitCheckoutTool } from './tools/checkout.js';
export { gitStashTool } from './tools/stash.js';

export function getAllGitTools() {
  return [
    gitStatusTool,
    gitDiffTool,
    gitLogTool,
    gitBranchTool,
    gitAddTool,
    gitCommitTool,
    gitCheckoutTool,
    gitStashTool,
  ];
}
