import { PermissionLevel } from './types.js';

export const DEFAULT_POLICIES: Record<string, PermissionLevel> = {
  'filesystem.list': PermissionLevel.SAFE,
  'filesystem.search': PermissionLevel.SAFE,
  'filesystem.read': PermissionLevel.SAFE,
  'filesystem.metadata': PermissionLevel.SAFE,
  'filesystem.diskUsage': PermissionLevel.SAFE,
  'filesystem.findDuplicates': PermissionLevel.SAFE,
  'filesystem.write': PermissionLevel.APPROVAL,
  'filesystem.edit': PermissionLevel.APPROVAL,
  'filesystem.createFile': PermissionLevel.APPROVAL,
  'filesystem.createDirectory': PermissionLevel.APPROVAL,
  'filesystem.move': PermissionLevel.APPROVAL,
  'filesystem.copy': PermissionLevel.APPROVAL,
  'filesystem.rename': PermissionLevel.APPROVAL,
  'filesystem.delete': PermissionLevel.HIGH_RISK,
  'git.status': PermissionLevel.SAFE,
  'git.diff': PermissionLevel.SAFE,
  'git.log': PermissionLevel.SAFE,
  'git.branch': PermissionLevel.SAFE,
  'git.add': PermissionLevel.APPROVAL,
  'git.commit': PermissionLevel.APPROVAL,
  'git.stash': PermissionLevel.APPROVAL,
  'git.checkout': PermissionLevel.APPROVAL,
  'git.createBranch': PermissionLevel.APPROVAL,
  'git.merge': PermissionLevel.APPROVAL,
  'git.push': PermissionLevel.HIGH_RISK,
  'git.resetHard': PermissionLevel.HIGH_RISK,
  'shell.execute': PermissionLevel.APPROVAL,
};

export function resolvePermission(
  toolName: string,
  declared: PermissionLevel,
): PermissionLevel {
  return DEFAULT_POLICIES[toolName] ?? declared;
}
