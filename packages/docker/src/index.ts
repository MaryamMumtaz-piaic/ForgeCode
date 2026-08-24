import { dockerRunTool } from './tools/run.js';
import { dockerBuildTool } from './tools/build.js';
import { dockerPsTool } from './tools/ps.js';

export { dockerRunTool } from './tools/run.js';
export { dockerBuildTool } from './tools/build.js';
export { dockerPsTool } from './tools/ps.js';

export function getAllDockerTools() {
  return [dockerRunTool, dockerBuildTool, dockerPsTool];
}
