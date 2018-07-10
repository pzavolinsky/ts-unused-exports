import { File, Imports, Analysis } from './types';
export { Analysis } from './types'

interface FileExports {
  [index:string]:number
}

interface ExportMap {
  [index:string]:FileExports
}

const getFileExports = (exports:string[]) : FileExports => {
  const ex:FileExports = {};
  exports.forEach(e => ex[e] = 0);
  return ex;
};

const getExportMap = (files:File[]) : ExportMap => {
  const map:ExportMap = {};
  files.forEach(file => {
    map[file.path] = getFileExports(file.exports);
  });
  return map;
};

const processImports = (imports:Imports, exportMap:ExportMap) => {
  Object.keys(imports).forEach(key => {
    const ex = exportMap[key];
    if (!ex) return;
    imports[key].forEach(imp =>
      imp == '*'
      ? Object.keys(ex).filter(e => e != 'default').forEach(e => ++ex[e])
      : ++ex[imp]);
  });
};

const expandExportFromStar = (files:File[], exportMap:ExportMap) => {
  files.forEach(file => {
    const fileExports = exportMap[file.path];
    file
      .exports
      .filter(ex => ex.indexOf('*:') === 0)
      .forEach(ex => {
        delete fileExports[ex];
        Object.keys(exportMap[ex.slice(2)])
          .filter(e => e != 'default')
          .forEach(key => fileExports[key] = 0);
      });
  });
};

export default (files:File[]) : Analysis => {
  const exportMap = getExportMap(files);
  expandExportFromStar(files, exportMap);
  files.forEach(file => processImports(file.imports, exportMap));

  const analysis:Analysis = {};

  Object.keys(exportMap).forEach(file => {
    const ex = exportMap[file];
    const unused = Object.keys(ex).filter(k => ex[k] === 0);
    if (unused.length) analysis[file] = unused;
  });

  return analysis;
};
