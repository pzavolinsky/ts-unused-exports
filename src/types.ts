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

interface AnalysisExports {
  [index: string]: ExportNameAndLocation[];
}

interface AnalysisUnusedFiles {
  unusedFiles?: string[];
}

export type Analysis = {
  unusedExports: AnalysisExports;
} & AnalysisUnusedFiles;

export interface TsConfigPaths {
  [glob: string]: string[];
}

export interface TsConfig {
  baseUrl: string;
  paths?: TsConfigPaths;
  files: string[];
}

export interface ExtraCommandLineOptions {
  allowUnusedEnums?: boolean;
  allowUnusedTypes?: boolean;
  excludeDeclarationFiles?: boolean;
  exitWithCount?: boolean;
  exitWithUnusedTypesCount?: boolean;
  ignoreFilesRegex?: string[];
  ignoreLocallyUsed?: boolean;
  maxIssues?: number;
  pathsToExcludeFromReport?: string[];
  searchNamespaces?: boolean;
  showLineNumber?: boolean;
  silent?: boolean;
  findCompletelyUnusedFiles?: boolean;
}

export interface ExtraOptionsForPresentation {
  baseUrl?: string;
}
