export interface Imports {
  [index: string]: string[];
}

export interface File {
  path: string;
  fullPath: string;
  imports: Imports;
  // The exported type names
  exports: string[];
  // The line number and column for each export - Matches the exports array.
  exportLocations: LocationInFile[];
}

export interface LocationInFile {
  /** 1-based. */
  line: number;
  character: number;
}

interface ExportNameAndLocation {
  exportName: string;
  location: LocationInFile;
}

export interface Analysis {
  [index: string]: ExportNameAndLocation[];
}

export interface TsConfigPaths {
  [glob: string]: string[];
}

export interface TsConfig {
  baseUrl: string;
  paths?: TsConfigPaths;
  files: string[];
}

export interface ExtraCommandLineOptions {
  exitWithCount?: boolean;
  excludeDeclarationFiles?: boolean;
  pathsToIgnore?: string[];
  enableSearchNamespaces?: boolean;
  showLineNumber?: boolean;
}
