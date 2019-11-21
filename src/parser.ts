import * as ts from 'typescript';
import * as tsconfigPaths from 'tsconfig-paths';

import {
  File,
  Imports,
  LocationInFile,
  TsConfig,
  TsConfigPaths,
  ExtraCommandLineOptions,
} from './types';
import { dirname, join, relative, resolve, sep } from 'path';
import { existsSync, readFileSync } from 'fs';

const TRIM_QUOTES = /^['"](.*)['"]$/;

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

interface FromWhat {
  from: string;
  what: string[];
}

const star = ['*'];

const getFromText = (moduleSpecifier: string): string =>
  moduleSpecifier.replace(TRIM_QUOTES, '$1').replace(/\/index$/, '');

const getFrom = (moduleSpecifier: ts.Expression): string =>
  getFromText(moduleSpecifier.getText());

const extractImport = (decl: ts.ImportDeclaration): FromWhat => {
  const from = getFrom(decl.moduleSpecifier);
  const { importClause } = decl;
  if (!importClause)
    return {
      from,
      what: star,
    };

  const { namedBindings } = importClause;
  const importDefault = !!importClause.name ? ['default'] : [];
  const importStar =
    namedBindings && !!(namedBindings as ts.NamespaceImport).name ? star : [];
  const importNames =
    namedBindings && !importStar.length
      ? (namedBindings as ts.NamedImports).elements.map(
          e => (e.propertyName || e.name).text,
        )
      : [];

  return {
    from,
    what: importDefault.concat(importStar, importNames),
  };
};

const extractExportStatement = (decl: ts.ExportDeclaration): string[] => {
  return decl.exportClause
    ? decl.exportClause.elements.map(e => (e.name || e.propertyName).text)
    : [];
};

const extractExportFromImport = (
  decl: ts.ExportDeclaration,
  moduleSpecifier: ts.Expression,
): FromWhat => {
  const { exportClause } = decl;
  const what = exportClause
    ? exportClause.elements.map(e => (e.propertyName || e.name).text)
    : star;

  return {
    from: getFrom(moduleSpecifier),
    what,
  };
};

const extractExport = (path: string, node: ts.Node): string => {
  switch (node.kind) {
    case ts.SyntaxKind.VariableStatement:
      return (node as ts.VariableStatement).declarationList.declarations[0].name.getText();
    case ts.SyntaxKind.FunctionDeclaration:
      const { name } = node as ts.FunctionDeclaration;
      return name ? name.text : 'default';
    default: {
      console.warn(`WARN: ${path}: unknown export node (kind:${node.kind})`);
      break;
    }
  }
  return '';
};

const relativeTo = (rootDir: string, file: string, path: string): string =>
  relative(rootDir, resolve(dirname(file), path));

const isRelativeToBaseDir = (baseDir: string, from: string): boolean =>
  existsSync(resolve(baseDir, `${from}.js`)) ||
  existsSync(resolve(baseDir, `${from}.ts`)) ||
  existsSync(resolve(baseDir, `${from}.tsx`)) ||
  existsSync(resolve(baseDir, from, 'index.js')) ||
  existsSync(resolve(baseDir, from, 'index.ts')) ||
  existsSync(resolve(baseDir, from, 'index.tsx'));

const hasModifier = (node: ts.Node, mod: ts.SyntaxKind): boolean | undefined =>
  node.modifiers && node.modifiers.filter(m => m.kind === mod).length > 0;

const extractFilename = (rootDir: string, path: string): string => {
  let name = relative(rootDir, path).replace(/([\\/]index)?\.[^.]*$/, '');

  // Imports always have the '.d' part dropped from the filename,
  // so for the export counting to work with d.ts files, we need to also drop '.d' part.
  // Assumption: the same folder will not contain two files like: a.ts, a.d.ts.
  if (!!name.match(/\.d$/)) {
    name = name.substr(0, name.length - 2);
  }

  return name;
};

const addExportCore = (
  exportName: string,
  file: ts.SourceFile,
  node: ts.Node,
  exportLocations: LocationInFile[],
  exports: string[],
): void => {
  exports.push(exportName);

  const location = file.getLineAndCharacterOfPosition(node.getStart());

  exportLocations.push({
    line: location.line + 1,
    character: location.character,
  });
};

const addImportCore = (
  fw: FromWhat,
  rootDir: string,
  path: string,
  imports: Imports,
  tsconfigPathsMatcher?: tsconfigPaths.MatchPath,
  baseDir?: string,
  baseUrl?: string,
): string | undefined => {
  const { from, what } = fw;

  const getKey = (from: string): string | undefined => {
    if (from[0] == '.') {
      // An undefined return indicates the import is from 'index.ts' or similar == '.'
      return relativeTo(rootDir, path, from) || '.';
    } else if (baseDir && baseUrl) {
      let matchedPath;

      return isRelativeToBaseDir(baseDir, from)
        ? baseUrl && join(baseUrl, from)
        : tsconfigPathsMatcher &&
          (matchedPath = tsconfigPathsMatcher(
            from,
            undefined,
            undefined,
            EXTENSIONS,
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

const isNodeDisabledViaComment = (
  node: ts.Node,
  file: ts.SourceFile,
): boolean => {
  const comments = ts.getLeadingCommentRanges(
    file.getFullText(),
    node.getFullStart(),
  );

  if (comments) {
    const commentRange = comments[comments.length - 1];
    const commentText = file
      .getFullText()
      .substring(commentRange.pos, commentRange.end);
    if (commentText === '// ts-unused-exports:disable-next-line') {
      return true;
    }
  }

  return false;
};
type WithExpression = ts.Node & {
  expression: ts.Expression;
};

export function isWithExpression(node: ts.Node): node is WithExpression {
  const myInterface = node as WithExpression;
  return !!myInterface.expression;
}

type WithArguments = ts.Node & {
  arguments: ts.NodeArray<ts.Expression>;
};

export function isWithArguments(node: ts.Node): node is WithArguments {
  const myInterface = node as WithArguments;
  return !!myInterface.arguments;
}

const addDynamicImports = (
  node: ts.Node,
  addImport: (fw: FromWhat) => void,
): void => {
  const addImportsInAnyExpression = (node: ts.Node): void => {
    const getArgumentFrom = (node: ts.Node): string | undefined => {
      if (isWithArguments(node)) {
        return node.arguments[0].getText();
      }
    };

    if (isWithExpression(node)) {
      let expr = node;
      while (isWithExpression(expr)) {
        const newExpr = expr.expression;

        if (newExpr.getText() === 'import') {
          const importing = getArgumentFrom(expr);

          if (!!importing) {
            addImport({
              from: getFromText(importing),
              what: ['default'],
            });
          }
        }

        if (isWithExpression(newExpr)) {
          expr = newExpr;
        } else {
          break;
        }
      }
    }
  };

  const recurseIntoChildren = (next: ts.Node): void => {
    addImportsInAnyExpression(next);

    next.getChildren().forEach(recurseIntoChildren);
  };

  recurseIntoChildren(node);
};

const mapFile = (
  rootDir: string,
  path: string,
  file: ts.SourceFile,
  baseUrl?: string,
  paths?: TsConfigPaths,
): File => {
  const imports: Imports = {};
  let exports: string[] = [];
  const exportLocations: LocationInFile[] = [];
  const name = extractFilename(rootDir, path);

  const baseDir = baseUrl && resolve(rootDir, baseUrl);
  const tsconfigPathsMatcher =
    (!!baseDir && !!paths && tsconfigPaths.createMatchPath(baseDir, paths)) ||
    undefined;

  const addImport = (fw: FromWhat): string | undefined => {
    return addImportCore(
      fw,
      rootDir,
      path,
      imports,
      tsconfigPathsMatcher,
      baseDir,
      baseUrl,
    );
  };

  const addExport = (exportName: string, node: ts.Node): void => {
    addExportCore(exportName, file, node, exportLocations, exports);
  };

  ts.forEachChild(file, (node: ts.Node) => {
    if (isNodeDisabledViaComment(node, file)) {
      return;
    }

    const { kind } = node;

    if (kind === ts.SyntaxKind.ImportDeclaration) {
      addImport(extractImport(node as ts.ImportDeclaration));
      return;
    }

    if (kind === ts.SyntaxKind.ExportAssignment) {
      addExport('default', node);
      return;
    }

    if (kind === ts.SyntaxKind.ExportDeclaration) {
      const exportDecl = node as ts.ExportDeclaration;
      const { moduleSpecifier } = exportDecl;
      if (moduleSpecifier === undefined) {
        extractExportStatement(exportDecl).forEach(e => addExport(e, node));
        return;
      } else {
        const fw = extractExportFromImport(exportDecl, moduleSpecifier);
        const key = addImport(fw);
        if (key) {
          const { what } = fw;
          if (what == star) {
            addExport(`*:${key}`, node);
          } else {
            exports = exports.concat(what);
          }
        }
        return;
      }
    }

    // Searching for dynamic imports requires inspecting statements in the file,
    // so for performance should only be done when necessary.
    const mightContainDynamicImports = node.getText().indexOf('import(') > -1;
    if (mightContainDynamicImports) {
      addDynamicImports(node, addImport);
    }

    if (hasModifier(node, ts.SyntaxKind.ExportKeyword)) {
      if (hasModifier(node, ts.SyntaxKind.DefaultKeyword)) {
        addExport('default', node);
        return;
      }
      const decl = node as ts.DeclarationStatement;
      const name = decl.name ? decl.name.text : extractExport(path, node);

      if (name) addExport(name, node);
    }
  });

  return {
    path: name,
    fullPath: path,
    imports,
    exports,
    exportLocations,
  };
};

const parseFile = (
  rootDir: string,
  path: string,
  baseUrl?: string,
  paths?: TsConfigPaths,
): File =>
  mapFile(
    rootDir,
    path,
    ts.createSourceFile(
      path,
      readFileSync(path, { encoding: 'utf8' }),
      ts.ScriptTarget.ES2015,
      /*setParentNodes */ true,
    ),
    baseUrl,
    paths,
  );

const parsePaths = (
  rootDir: string,
  { baseUrl, files: filePaths, paths }: TsConfig,
  extraOptions?: ExtraCommandLineOptions,
): File[] => {
  const includeDeclarationFiles =
    extraOptions && !extraOptions.excludeDeclarationFiles;

  const files = filePaths
    .filter(p => includeDeclarationFiles || p.indexOf('.d.') === -1)
    .map(path => parseFile(rootDir, resolve(rootDir, path), baseUrl, paths));

  return files;
};

export default (
  rootDir: string,
  TsConfig: TsConfig,
  extraOptions?: ExtraCommandLineOptions,
): File[] => {
  return parsePaths(rootDir, TsConfig, extraOptions);
};
