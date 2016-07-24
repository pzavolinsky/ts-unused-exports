import { readFileSync } from 'fs';
import { dirname, resolve, relative } from 'path';
import * as ts from 'typescript';
import { File, Imports } from './types';

const TRIM_QUOTES = /^['"](.*)['"]$/;

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

const extractExport = (node:ts.Node):string => {
  switch (node.kind) {
    case ts.SyntaxKind.VariableStatement:
      return (node as ts.VariableStatement)
        .declarationList
        .declarations[0]
        .name
        .getText();
    default: {
      console.warn(`WARN: unknown export node (kind:${node.kind})`);
      break;
    }
  }
  return '';
};

const relativeTo = (rootDir:string, file:string, path:string) : string =>
  relative(rootDir, resolve(dirname(file), path));

const mapFile = (rootDir:string, path:string, file:ts.SourceFile) : File => {
  const imports:Imports = {};
  let exports:string[] = [];
  const name = relative(rootDir, path).replace(/([\\/]index)?\.[^.]*$/, '');
  const addImport = (fw:FromWhat) => {
    const { from, what } = fw;
    if (from[0] != '.') return;
    const key = relativeTo(rootDir, path, from);
    const items = imports[key] || [];
    imports[key] = items.concat(what);
  };

  ts.forEachChild(file, (node:ts.Node) => {
    switch (node.kind) {
      case ts.SyntaxKind.ImportDeclaration: {
        addImport(extractImport(node as ts.ImportDeclaration));
        break;
      }
      case ts.SyntaxKind.ExportAssignment: {
        exports.push('default');
        break;
      }
      case ts.SyntaxKind.ExportDeclaration: {
        const fw = extractExportFromImport(node as ts.ExportDeclaration);
        addImport(fw);
        const { from, what } = fw;
        if (from[0] == '.') {
          const key = relativeTo(rootDir, path, from);
          if (what == star) {
            exports.push(`*:${key}`);
          } else {
            exports = exports.concat(what);
          }
        }
        break;
      }
      default: {
        if ((node.flags & ts.NodeFlags.Export) === ts.NodeFlags.Export) {
          const decl = (node as ts.DeclarationStatement);
          const name = decl.name
            ? decl.name.text
            : extractExport(node);
          if (name) exports.push(name);
        }
        break;
      }
    }
  });

  return {
    path: name,
    imports,
    exports
  };
};

const parseFile = (rootDir:string, path:string) : File =>
  mapFile(
    rootDir,
    path,
    ts.createSourceFile(
      path,
      readFileSync(path, { encoding: 'utf8' }),
      ts.ScriptTarget.ES6,
      /*setParentNodes */ true
    )
  );

export default (rootDir:string, paths:string[]):File[] =>
  paths
  .filter(p => p.indexOf('.d.') == -1)
  .map(path => parseFile(rootDir, resolve(rootDir, path)));
