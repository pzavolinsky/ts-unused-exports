export interface Imports {
  [index:string]:string[];
}

export interface File {
  path: string;
  fullPath: string;
  imports: Imports;
  exports: string[];
}

export interface Analysis {
  [index:string]:string[];
}

export interface TsConfigPaths {
  [glob:string]:string[];
}

export interface TsConfig {
  baseUrl?: string;
  paths?: TsConfigPaths;
  files: string[];
}

export interface ExtraCommandLineOptions {
  pathsToIgnore?: string[];
}
