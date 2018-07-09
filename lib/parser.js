"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var path_1 = require("path");
var ts = require("typescript");
var TRIM_QUOTES = /^['"](.*)['"]$/;
var star = ['*'];
var getFrom = function (moduleSpecifier) {
    return moduleSpecifier
        .getText()
        .replace(TRIM_QUOTES, '$1')
        .replace(/\/index$/, '');
};
var extractImport = function (decl) {
    var from = getFrom(decl.moduleSpecifier);
    var importClause = decl.importClause;
    if (!importClause)
        return {
            from: from,
            what: star
        };
    var namedBindings = importClause.namedBindings;
    var importDefault = !!importClause.name
        ? ['default']
        : [];
    var importStar = namedBindings
        && !!namedBindings.name
        ? star
        : [];
    var importNames = namedBindings
        && !importStar.length
        ? namedBindings
            .elements
            .map(function (e) { return (e.propertyName || e.name).text; })
        : [];
    return {
        from: from,
        what: importDefault.concat(importStar, importNames)
    };
};
var extractExportStatement = function (decl) {
    return decl.exportClause
        ? decl.exportClause.elements
            .map(function (e) { return (e.propertyName || e.name).text; })
        : [];
};
var extractExportFromImport = function (decl) {
    var moduleSpecifier = decl.moduleSpecifier, exportClause = decl.exportClause;
    if (!moduleSpecifier)
        return {
            from: '',
            what: []
        };
    var what = exportClause
        ? exportClause.elements
            .map(function (e) { return (e.propertyName || e.name).text; })
        : star;
    return {
        from: getFrom(moduleSpecifier),
        what: what
    };
};
var extractExport = function (path, node) {
    switch (node.kind) {
        case ts.SyntaxKind.VariableStatement:
            return node
                .declarationList
                .declarations[0]
                .name
                .getText();
        case ts.SyntaxKind.FunctionDeclaration:
            var name_1 = node.name;
            return name_1
                ? name_1.text
                : 'default';
        default: {
            console.warn("WARN: " + path + ": unknown export node (kind:" + node.kind + ")");
            break;
        }
    }
    return '';
};
var relativeTo = function (rootDir, file, path) {
    return path_1.relative(rootDir, path_1.resolve(path_1.dirname(file), path));
};
var isRelativeToBaseDir = function (baseDir, from) {
    return fs_1.existsSync(path_1.resolve(baseDir, from + ".js"))
        || fs_1.existsSync(path_1.resolve(baseDir, from + ".ts"))
        || fs_1.existsSync(path_1.resolve(baseDir, from + ".tsx"))
        || fs_1.existsSync(path_1.resolve(baseDir, from, 'index.js'))
        || fs_1.existsSync(path_1.resolve(baseDir, from, 'index.ts'))
        || fs_1.existsSync(path_1.resolve(baseDir, from, 'index.tsx'));
};
var hasModifier = function (node, mod) {
    return node.modifiers
        && node.modifiers.filter(function (m) { return m.kind === mod; }).length > 0;
};
var mapFile = function (rootDir, path, file, baseUrl) {
    var imports = {};
    var exports = [];
    var name = path_1.relative(rootDir, path).replace(/([\\/]index)?\.[^.]*$/, '');
    var baseDir = baseUrl && path_1.resolve(rootDir, baseUrl);
    var addImport = function (fw) {
        var from = fw.from, what = fw.what;
        var key = from[0] == '.'
            ? relativeTo(rootDir, path, from)
            : baseDir && baseUrl && isRelativeToBaseDir(baseDir, from)
                ? path_1.join(baseUrl, from)
                : undefined;
        if (!key)
            return undefined;
        var items = imports[key] || [];
        imports[key] = items.concat(what);
        return key;
    };
    ts.forEachChild(file, function (node) {
        var kind = node.kind;
        if (kind === ts.SyntaxKind.ImportDeclaration) {
            addImport(extractImport(node));
            return;
        }
        if (kind === ts.SyntaxKind.ExportAssignment) {
            exports.push('default');
            return;
        }
        if (kind === ts.SyntaxKind.ExportDeclaration) {
            if (node.moduleSpecifier === undefined) {
                exports.push.apply(exports, extractExportStatement(node));
                return;
            }
            else {
                var fw = extractExportFromImport(node);
                var key = addImport(fw);
                if (key) {
                    var what = fw.what;
                    if (what == star) {
                        exports.push("*:" + key);
                    }
                    else {
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
            var decl = node;
            var name_2 = decl.name
                ? decl.name.text
                : extractExport(path, node);
            if (name_2)
                exports.push(name_2);
        }
    });
    return {
        path: name,
        imports: imports,
        exports: exports
    };
};
var parseFile = function (rootDir, path, baseUrl) {
    return mapFile(rootDir, path, ts.createSourceFile(path, fs_1.readFileSync(path, { encoding: 'utf8' }), ts.ScriptTarget.ES2015, 
    /*setParentNodes */ true), baseUrl);
};
var resolvePath = function (rootDir) { return function (path) {
    var tsPath = path + ".ts";
    if (fs_1.existsSync(path_1.resolve(rootDir, tsPath)))
        return tsPath;
    var tsxPath = path + ".tsx";
    if (fs_1.existsSync(path_1.resolve(rootDir, tsxPath)))
        return tsxPath;
    var jsIndexPath = path + "/index.js";
    if (fs_1.existsSync(path_1.resolve(rootDir, jsIndexPath)))
        return jsIndexPath;
    var tsIndexPath = path + "/index.ts";
    if (fs_1.existsSync(path_1.resolve(rootDir, tsIndexPath)))
        return tsIndexPath;
    var tsxIndexPath = path + "/index.tsx";
    if (fs_1.existsSync(path_1.resolve(rootDir, tsxIndexPath)))
        return tsxIndexPath;
    var jsPath = path + ".js";
    if (fs_1.existsSync(path_1.resolve(rootDir, jsPath)))
        return jsPath;
    if (fs_1.existsSync(path_1.resolve(rootDir, path))) {
        return null; // we have an explicit path that is *not* a TS (e.g. `.sass`).
    }
    throw "Cannot find module '" + path + "'.\n  I've tried the following paths and none of them works:\n  - " + tsPath + "\n  - " + tsxPath + "\n  - " + tsIndexPath + "\n  - " + tsxIndexPath + "\n  - " + jsPath + "\n  - " + path + " (only to skip it later)\n  ";
}; };
var notNull = function (v) { return v !== null; };
var parsePaths = function (rootDir, paths, baseUrl, otherFiles) {
    var _a;
    var files = otherFiles.concat(paths
        .filter(function (p) { return p.indexOf('.d.') == -1; })
        .map(function (path) { return parseFile(rootDir, path_1.resolve(rootDir, path), baseUrl); }));
    var found = {};
    files.forEach(function (f) { return found[f.path] = f; });
    var missingImports = (_a = []).concat.apply(_a, files.map(function (f) { return Object.keys(f.imports); })).filter(function (i) { return !found[i]; })
        .map(resolvePath(rootDir))
        .filter(notNull);
    return missingImports.length
        ? parsePaths(rootDir, missingImports, baseUrl, files)
        : files;
};
exports.default = (function (rootDir, paths, baseUrl) {
    return parsePaths(rootDir, paths, baseUrl, []);
});
