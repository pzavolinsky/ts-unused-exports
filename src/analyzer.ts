import { Analysis, ExtraCommandLineOptions, File, Imports } from './types';
export { Analysis } from './types'

interface FileExports {
  [index: string]: number
}

interface ExportItem {
  exports: FileExports,
  path: string;
}

interface ExportMap {
  [index: string]: ExportItem;
}

const getFileExports = (file: File): ExportItem => {
  const exports: FileExports = {};
  file.exports.forEach(e => exports[e] = 0);

  return { exports, path: file.fullPath };
};

const getExportMap = (files: File[]): ExportMap => {
  const map: ExportMap = {};
  files.forEach(file => {
    map[file.path] = getFileExports(file);
  });
  return map;
};

const processImports = (imports: Imports, exportMap: ExportMap) => {
  Object.keys(imports).forEach(key => {
    const ex = exportMap[key] && exportMap[key].exports;
    if (!ex) return;
    imports[key].forEach(imp =>
      imp == '*'
        ? Object.keys(ex).filter(e => e != 'default').forEach(e => ++ex[e])
        : ++ex[imp]);
  });
};

const expandExportFromStar = (files: File[], exportMap: ExportMap) => {
  files.forEach(file => {
    const fileExports = exportMap[file.path];
    file
      .exports
      .filter(ex => ex.indexOf('*:') === 0)
      .forEach(ex => {
        delete fileExports.exports[ex];

        Object.keys(exportMap[ex.slice(2)].exports)
          .filter(e => e != 'default')
          .forEach(key => fileExports.exports[key] = 0);
      });
  });
};

// Allow disabling of results, by path from command line (useful for large projects)
const shouldPathBeIgnored = (path: string, extraOptions?: ExtraCommandLineOptions) => {
  if (!extraOptions || !extraOptions.pathsToIgnore) {
    return false;
  }

  return extraOptions.pathsToIgnore.some(ignore => path.indexOf(ignore) >= 0);
}

export default (files: File[], extraOptions?: ExtraCommandLineOptions): Analysis => {
  const exportMap = getExportMap(files);
  expandExportFromStar(files, exportMap);
  files.forEach(file => processImports(file.imports, exportMap));

  const analysis: Analysis = {};

  Object.keys(exportMap).forEach(file => {
    const expItem = exportMap[file];
    const { exports, path } = expItem;
    const unused = Object.keys(exports).filter(k => exports[k] === 0);

    if (unused.length && !shouldPathBeIgnored(path, extraOptions)) analysis[path] = unused;
  });

  return analysis;
};
