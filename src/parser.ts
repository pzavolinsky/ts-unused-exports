import { existsSync, readFileSync } from 'fs';
import { dirname, resolve, relative, join, sep } from 'path';
import * as ts from 'typescript';
import * as tsconfigPaths from 'tsconfig-paths';
import { File, TsConfig, TsConfigPaths, Imports, ExtraCommandLineOptions } from './types';

const TRIM_QUOTES = /^['"](.*)['"]$/;

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

interface FromWhat {
  from: string
  what: string[]
}

const star = ['*'];

const getFrom = (moduleSpecifier:ts.Expression) =>
  moduleSpecifier
  .getText()
  .replace(TRIM_QUOTES, '$1')
  .replace(/\/index$/, '');

const extractImport = (decl:ts.ImportDeclaration) : FromWhat => {
  const from = getFrom(decl.moduleSpecifier);
  const { importClause } = decl;
  if (!importClause) return {
    from,
    what: star
  };

  const { namedBindings } = importClause;
  const importDefault = !!importClause.name
    ? ['default']
    : [];
  const importStar =
    namedBindings
    && !!(namedBindings as ts.NamespaceImport).name
    ? star
    : [];
  const importNames =
    namedBindings
    && !importStar.length
    ? (namedBindings as ts.NamedImports)
      .elements
      .map(e => (e.propertyName || e.name).text)
    : [];

  return {
    from,
    what: importDefault.concat(importStar, importNames)
  };
};

const extractExportStatement = (decl:ts.ExportDeclaration): string[] => {
  return decl.exportClause
    ? decl.exportClause.elements
      .map(e => (e.name || e.propertyName).text)
    : [];
};

const extractExportFromImport = (decl:ts.ExportDeclaration) : FromWhat => {
  const { moduleSpecifier, exportClause } = decl;
  if (!moduleSpecifier) return {
    from: '',
    what: []
  };

  const what = exportClause
    ? exportClause.elements
      .map(e => (e.propertyName || e.name).text)
    : star;

  return {
    from: getFrom(moduleSpecifier),
    what
  };
};

const extractExport = (path:string, node:ts.Node):string => {
  switch (node.kind) {
    case ts.SyntaxKind.VariableStatement:
      return (node as ts.VariableStatement)
        .declarationList
        .declarations[0]
        .name
        .getText();
    case ts.SyntaxKind.FunctionDeclaration:
      const { name } = (node as ts.FunctionDeclaration);
      return name
        ? name.text
        : 'default';
    default: {
      console.warn(`WARN: ${path}: unknown export node (kind:${node.kind})`);
      break;
    }
  }
  return '';
};

const relativeTo = (rootDir:string, file:string, path:string) : string =>
  relative(rootDir, resolve(dirname(file), path));

const isRelativeToBaseDir = (baseDir:string, from:string) =>
  existsSync(resolve(baseDir, `${from}.js`))
  || existsSync(resolve(baseDir, `${from}.ts`))
  || existsSync(resolve(baseDir, `${from}.tsx`))
  || existsSync(resolve(baseDir, from, 'index.js'))
  || existsSync(resolve(baseDir, from, 'index.ts'))
  || existsSync(resolve(baseDir, from, 'index.tsx'))
  ;

const hasModifier = (node:ts.Node, mod:ts.SyntaxKind) =>
  node.modifiers
  && node.modifiers .filter(m => m.kind === mod).length > 0;

const mapFile = (
  rootDir:string,
  path:string,
  file:ts.SourceFile,
  baseUrl?:string,
  paths?:TsConfigPaths,
) : File => {
  const imports:Imports = {};
  let exports:string[] = [];
  const name = relative(rootDir, path).replace(/([\\/]index)?\.[^.]*$/, '');
  const baseDir = baseUrl && resolve(rootDir, baseUrl);

  const tsconfigPathsMatcher =
    baseDir && paths && tsconfigPaths.createMatchPath(baseDir, paths);

  const addImport = (fw:FromWhat) => {
    const { from, what } = fw;

    const getKey = (from:string) => {
      if (from[0] == '.') {
        return relativeTo(rootDir, path, from);
      } else if (baseDir && baseUrl) {
        let matchedPath;

        return isRelativeToBaseDir(baseDir, from)
          ? baseUrl && join(baseUrl, from)
          : tsconfigPathsMatcher &&
            (matchedPath = tsconfigPathsMatcher(
              from,
              undefined,
              undefined,
              EXTENSIONS
            ))
            ? matchedPath.replace(`${baseDir}${sep}`, '')
        : undefined;
      }

      return undefined;
    };

    const key = getKey(from);
    if (!key) return undefined;
    const items = imports[key] || [];
    imports[key] = items.concat(what);
    return key;
  };

  ts.forEachChild(file, (node:ts.Node) => {
    const comments = ts.getLeadingCommentRanges(
      file.getFullText(),
      node.getFullStart()
    );

    if (comments) {
      const commentRange = comments[comments.length - 1];
      const commentText = file
        .getFullText()
        .substring(commentRange.pos, commentRange.end);
      if (commentText === '// ts-unused-exports:disable-next-line') {
        return;
      }
    }

    const { kind } = node;

    if (kind === ts.SyntaxKind.ImportDeclaration) {
      addImport(extractImport(node as ts.ImportDeclaration));
      return;
    }

    if (kind === ts.SyntaxKind.ExportAssignment) {
      exports.push('default');
      return;
    }
    if (kind === ts.SyntaxKind.ExportDeclaration) {
      if ((node as ts.ExportDeclaration).moduleSpecifier === undefined) {
        exports.push(...extractExportStatement(node as ts.ExportDeclaration));
        return;
      } else {
        const fw = extractExportFromImport(node as ts.ExportDeclaration);
        const key = addImport(fw);
        if (key) {
          const { what } = fw;
          if (what == star) {
            exports.push(`*:${key}`);
          } else {
            exports = exports.concat(what);
          }
        }
        return;
      }
    }

    if (hasModifier(node, ts.SyntaxKind.ExportKeyword)) {
      if (hasModifier(node, ts.SyntaxKind.DefaultKeyword)) {
        exports.push('default');
        return;
      }
      const decl = (node as ts.DeclarationStatement);
      const name = decl.name
        ? decl.name.text
        : extractExport(path, node);

      if (name) exports.push(name);
    }
  });

  return {
    path: name,
    fullPath: path,
    imports,
    exports
  };
};

const parseFile = (
  rootDir:string,
  path:string,
  baseUrl?:string,
  paths?:TsConfigPaths
): File =>
  mapFile(
    rootDir,
    path,
    ts.createSourceFile(
      path,
      readFileSync(path, { encoding: 'utf8' }),
      ts.ScriptTarget.ES2015,
      /*setParentNodes */ true
    ),
    baseUrl,
    paths
  );

const parsePaths = (
  rootDir:string,
  {baseUrl, files: filePaths, paths}:TsConfig,
  extraOptions: ExtraCommandLineOptions
):File[] => {
  const files = filePaths
    .filter(p => p.indexOf('.d.') == -1 && !shouldPathBeIgnored(p, extraOptions.pathsToIgnore))
    .map(path => parseFile(rootDir, resolve(rootDir, path), baseUrl, paths));

  return files;
};

// Allow disabling of results, by path from command line (useful for large projects)
const shouldPathBeIgnored = (path: string, pathsToIgnore?: string[]) => {
  if(!pathsToIgnore) {
    return false;
  }

  const result = pathsToIgnore.some(ignore => path.indexOf(ignore) >= 0);

  return result;
}

export default (rootDir:string, TsConfig:TsConfig, extraOptions?: ExtraCommandLineOptions): File[] => {
  const activeExtraOptions = extraOptions || {};

  return parsePaths(rootDir, TsConfig, activeExtraOptions);
};