import { File } from './types';
import { hasValidArgs } from './argsParser';

import { dirname } from 'path';
import { loadTsConfig } from './app';
import parseFiles from './parser';
import { showUsage } from './usage';

interface FileMap {
  [index: string]: File;
}
interface Dups {
  [index: string]: boolean;
}

interface Dependency {
  name: string;
  depth: number;
  count: number;
  dependencies: Dependency[];
}

interface DepAnalysis {
  [index: string]: Dependency;
}

const getFileMap = (files: File[]): FileMap => {
  const map: FileMap = {};
  files.map(f => (map[f.path] = f));
  return map;
};

function analyzeFile(
  fileMap: FileMap,
  file: File,
  analysis: DepAnalysis,
): Dependency {
  const existing = analysis[file.path];

  if (existing) return existing;

  const dep: Dependency = {
    name: file.path,
    count: 1,
    depth: 1,
    dependencies: [],
  };

  analysis[file.path] = dep;

  const deps = Object.keys(file.imports).map(d =>
    analyzeFile(fileMap, fileMap[d], analysis),
  );

  const depth = deps.map(d => d.depth).reduce((a, b) => Math.max(a, b), 0);
  const count = deps.map(d => d.count).reduce((a, b) => a + b, 0);
  dep.depth = 1 + depth;
  dep.count = 1 + count;
  dep.dependencies = deps;

  return dep;
}

const analyzeDeps = (tsconfigPath: string): DepAnalysis => {
  const tsConfig = loadTsConfig(tsconfigPath);
  const files = parseFiles(dirname(tsconfigPath), tsConfig);
  const fileMap = getFileMap(files);

  const analysis: DepAnalysis = {};

  files.forEach(f => analyzeFile(fileMap, f, analysis));

  return analysis;
};

// Not using options here
const [tsconfig, filter] = process.argv.slice(2);

if (!hasValidArgs()) {
  showUsage();
  process.exit(-1);
}

const getValues = (o: DepAnalysis): Dependency[] =>
  Object.keys(o).reduce<Dependency[]>((v, k) => v.concat([o[k]]), []);

const analysis = analyzeDeps(tsconfig);
const deps = getValues(analysis);
deps.sort((a, b) => a.depth - b.depth);

console.log(`${deps.length} modules found`);

function dumpDep(dep: Dependency, dups: Dups = {}, padd = ''): boolean {
  const dup = dups[dep.name] ? ' [dup]' : '';
  console.log(`${padd}[${dep.depth - 1}|${dep.count - 1}] ${dep.name}${dup}`);
  return !dup;
}

function dumpDepRec(dep: Dependency, dups: Dups = {}, padd = ''): void {
  if (!dumpDep(dep, dups, padd)) return;
  dups[dep.name] = true;
  dep.dependencies.forEach(d => dumpDepRec(d, dups, `${padd}  `));
}

deps.forEach(d => dumpDep(d));

console.log(`${Object.keys(analysis).length} nodes in the dependency tree`);

if (filter) {
  const re = new RegExp(filter, 'i');
  deps
    .filter(d => d.name.match(re))
    .forEach(d => {
      console.log('-----------------');
      dumpDepRec(d);
    });
}
