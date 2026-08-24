export interface ProjectInfo {
  cwd: string;
  framework?: string;
  language?: string;
  packageManager?: string;
  testRunner?: string;
  buildTool?: string;
  hasGit: boolean;
  hasDocker: boolean;
  entryPoints: string[];
  configFiles: string[];
}

export interface FileEntry {
  path: string;
  relativePath: string;
  extension: string;
  sizeBytes: number;
  lines?: number;
}

export interface IndexedFile {
  path: string;
  relativePath: string;
  content: string;
  tokens: number;
}
