import {
  Analysis,
  ExtraCommandLineOptions,
  File,
  LocationInFile,
} from './types';
import {
  indexCandidateExtensions,
  indexCandidates,
  removeExportStarPrefix,
  removeFileExtensionToAllowForJs,
} from './parser/util';

export { Analysis } from './types';

interface FileExport {
  usageCount: number;
  location: LocationInFile;
}

interface FileExports {
  [index: string]: FileExport;
}

interface ExportItem {
  exports: FileExports;
  path: string;
  // Was the file imported at least once. If so, then can mark any export * as used (handles transitive export(import) like a -> b -> c).
  fileWasImported: boolean;
}

interface ExportMap {
  [index: string]: ExportItem;
}

const isExportArray = (e: string): boolean => {
  return e.startsWith('[') && e.endsWith(']');
};

const parseExportArray = (e: string): string[] => {
  return e
    .replace('[', '')
    .replace(']', '')
    .split(',')
    .map((e) => e.trim());
};

const getFileExports = (file: File): ExportItem => {
  const exports: FileExports = {};
  file.exports.forEach((e, index) => {
    const addExport = (exportName: string): void => {
      exports[exportName] = {
        usageCount: 0,
        location: file.exportLocations[index],
      };
    };

    if (isExportArray(e)) {
      const exportArray = parseExportArray(e);
      exportArray.forEach(addExport);
    } else {
      addExport(e);
    }
  });

  return { exports, path: file.fullPath, fileWasImported: false };
};

const getExportMap = (files: File[]): ExportMap => {
  const map: ExportMap = {};
  files.forEach((file) => {
    map[file.path] = getFileExports(file);
  });
  return map;
};

const processImports = (file: File, exportMap: ExportMap): void => {
  Object.keys(file.imports).forEach((key) => {
    const importedFileExports =
      exportMap[removeFileExtensionToAllowForJs(key)] || null;

    let ex = importedFileExports?.exports || null;

    // Handle imports from an index file
    if (!ex) {
      // Try matching import from /a/b/c -> /a/b/c/index.x
      for (let c = 0; c < indexCandidates.length; c++) {
        const indexKey = indexCandidates[c];
        ex = exportMap[indexKey]?.exports || undefined;
        if (ex) break;
      }

      if (!ex && key.endsWith('index')) {
        // Try matching import from /a/b/c/index -> /a/b/c/index.x
        for (let c = 0; c < indexCandidateExtensions.length; c++) {
          const indexKey = key + indexCandidateExtensions[c];
          ex = exportMap[indexKey]?.exports || undefined;
          if (ex) break;
        }
        if (!ex) {
          // Try matching import from /a/b/c/index -> /a/b/c
          const indexKey = key.substring(0, key.length - '/index'.length);
          ex = exportMap[indexKey]?.exports || undefined;
        }
      }
    }

    if (!ex) {
      // DEV DEBUG - console.warn(`Could not resolve ${key}`);
      return;
    }

    const addUsage = (imp: string): void => {
      if (!ex[imp]) {
        // The imported symbol we are checking was not found in the imported
        // file. For example:
        // `a.ts` import { b } from './b';
        // `b.ts` does not export a `b` symbol
        // In here `imp` is `b`, `imports` represents `a.ts` and `ex.exports`
        // are the symbols exported by `b.ts`
        ex[imp] = {
          usageCount: 0,
          location: {
            line: 1,
            character: 1,
          },
        };
      }

      // DEV DEBUG - console.log(`Marking as used: ${imp} in ${file.path}`);
      ex[imp].usageCount++;
    };

    if (!!importedFileExports) {
      importedFileExports.fileWasImported = true;
    }

    file.imports[key].forEach((imp) => {
      imp === '*' ? Object.keys(ex).forEach(addUsage) : addUsage(imp);
    });
  });
};

const expandExportFromStarOrStarAsForFile = (
  file: File,
  exportMap: ExportMap,
  prefix: string,
  isWithAlias: boolean,
): void => {
  const fileExports = exportMap[file.path];

  file.exports
    .filter((ex) => ex.startsWith(prefix))
    .forEach((ex) => {
      delete fileExports.exports[ex];

      const exports = exportMap[removeExportStarPrefix(ex)]?.exports;
      if (exports) {
        Object.keys(exports)
          .filter((e) => e != 'default')
          .forEach((key) => {
            if (!isWithAlias) {
              // Copy the exports from the imported file:
              if (!fileExports.exports[key]) {
                const export1 = exports[key];
                fileExports.exports[key] = {
                  usageCount: 0,
                  location: export1.location,
                };
              }
              fileExports.exports[key].usageCount = 0;
            }
            // else is export-as: so this file exports a new namespace.

            // Mark the items as imported, for the imported file:
            const importedFileExports = exportMap[removeExportStarPrefix(ex)];
            if (importedFileExports) {
              // DEV DEBUG
              /* console.log(
                `Marking as used: ${key} in ${removeExportStarPrefix(ex)}`,
              );
              console.dir(Object.keys(exportMap));*/
              importedFileExports.fileWasImported = true;
              importedFileExports.exports[key].usageCount++;
            }
          });
      }
    });
};

// export * from 'a' (no 'alias')
const expandExportFromStarForFile = (
  file: File,
  exportMap: ExportMap,
): void => {
  expandExportFromStarOrStarAsForFile(file, exportMap, '*:', false);
};

// export * as X from 'a' (has 'alias')
const expandExportFromStarAsForFile = (
  file: File,
  exportMap: ExportMap,
): void => {
  expandExportFromStarOrStarAsForFile(file, exportMap, '*as:', true);
};

const expandExportFromStar = (files: File[], exportMap: ExportMap): void => {
  files.forEach((file) => {
    expandExportFromStarForFile(file, exportMap);
    expandExportFromStarAsForFile(file, exportMap);
  });
};

// Allow disabling of *results*, by path from command line (useful for large projects)
const shouldPathBeExcludedFromResults = (
  path: string,
  extraOptions?: ExtraCommandLineOptions,
): boolean => {
  if (!extraOptions || !extraOptions.pathsToExcludeFromReport) {
    return false;
  }

  return extraOptions.pathsToExcludeFromReport.some((ignore) =>
    path.includes(ignore),
  );
};

const filterFiles = (
  files: File[],
  extraOptions?: ExtraCommandLineOptions,
): File[] => {
  if (!extraOptions?.ignoreFilesRegex) {
    return files;
  }

  const regexes = extraOptions.ignoreFilesRegex?.map((rex) => new RegExp(rex));

  const shouldIgnoreFile = (fileName: string): boolean => {
    return regexes.some((reg) => {
      return reg.test(fileName);
    });
  };

  return files.filter((f) => !shouldIgnoreFile(f.path));
};

const areEqual = (files1: string[], files2: string[]): boolean => {
  if (files1.length !== files2.length) return false;

  return files1.every((f) => files2.includes(f));
};

export default (
  files: File[],
  extraOptions?: ExtraCommandLineOptions,
): Analysis => {
  const filteredFiles = filterFiles(files, extraOptions);

  const exportMap = getExportMap(filteredFiles);
  expandExportFromStar(filteredFiles, exportMap);
  filteredFiles.forEach((file) => processImports(file, exportMap));

  const analysis: Analysis = {};
  const unusedFiles: string[] = [];

  Object.keys(exportMap).forEach((file) => {
    const expItem = exportMap[file];
    const { exports, path } = expItem;

    if (shouldPathBeExcludedFromResults(path, extraOptions)) return;

    const unusedExports = Object.keys(exports).filter((k) => {
      // If the file was imported at least once, then do NOT consider any of its 'export (import) *' as unused.
      // This avoids false positives with transitive import/exports like a -> b -> c.
      if (expItem.fileWasImported && k.startsWith('*')) {
        return false;
      }

      return exports[k].usageCount === 0;
    });

    if (unusedExports.length === 0) {
      return;
    }

    const realExportNames = Object.keys(exports);

    analysis[path] = [];
    unusedExports.forEach((e) => {
      analysis[path].push({
        exportName: e,
        location: exports[e].location,
      });
    });

    if (
      extraOptions?.findCompletelyUnusedFiles &&
      areEqual(realExportNames, unusedExports)
    ) {
      unusedFiles.push(path);
    }
  });

  if (extraOptions?.findCompletelyUnusedFiles) {
    analysis.unusedFiles = unusedFiles;
  }

  return analysis;
};
