import { browserNavigateTool } from './tools/navigate.js';
import { browserScreenshotTool } from './tools/screenshot.js';
import { browserClickTool } from './tools/click.js';

export { getBrowser, closeBrowser } from './manager.js';
export { browserNavigateTool } from './tools/navigate.js';
export { browserScreenshotTool } from './tools/screenshot.js';
export { browserClickTool } from './tools/click.js';

export function getAllBrowserTools() {
  return [browserNavigateTool, browserScreenshotTool, browserClickTool];
}
