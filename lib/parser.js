"use strict";
var fs_1 = require('fs');
var path_1 = require('path');
var ts = require('typescript');
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
var extractExport = function (node) {
    switch (node.kind) {
        case ts.SyntaxKind.VariableStatement:
            return node
                .declarationList
                .declarations[0]
                .name
                .getText();
        default: {
            console.warn("WARN: unknown export node (kind:" + node.kind + ")");
            break;
        }
    }
    return '';
};
var relativeTo = function (rootDir, file, path) {
    return path_1.relative(rootDir, path_1.resolve(path_1.dirname(file), path));
};
var mapFile = function (rootDir, path, file) {
    var imports = {};
    var exports = [];
    var name = path_1.relative(rootDir, path).replace(/([\\/]index)?\.[^.]*$/, '');
    var addImport = function (fw) {
        var from = fw.from, what = fw.what;
        if (from[0] != '.')
            return;
        var key = relativeTo(rootDir, path, from);
        var items = imports[key] || [];
        imports[key] = items.concat(what);
    };
    ts.forEachChild(file, function (node) {
        switch (node.kind) {
            case ts.SyntaxKind.ImportDeclaration: {
                addImport(extractImport(node));
                break;
            }
            case ts.SyntaxKind.ExportAssignment: {
                exports.push('default');
                break;
            }
            case ts.SyntaxKind.ExportDeclaration: {
                var fw = extractExportFromImport(node);
                addImport(fw);
                var from = fw.from, what = fw.what;
                if (from[0] == '.') {
                    var key = relativeTo(rootDir, path, from);
                    if (what == star) {
                        exports.push("*:" + key);
                    }
                    else {
                        exports = exports.concat(what);
                    }
                }
                break;
            }
            default: {
                if ((node.flags & ts.NodeFlags.Export) === ts.NodeFlags.Export) {
                    var decl = node;
                    var name_1 = decl.name
                        ? decl.name.text
                        : extractExport(node);
                    if (name_1)
                        exports.push(name_1);
                }
                break;
            }
        }
    });
    return {
        path: name,
        imports: imports,
        exports: exports
    };
};
var parseFile = function (rootDir, path) {
    return mapFile(rootDir, path, ts.createSourceFile(path, fs_1.readFileSync(path, { encoding: 'utf8' }), ts.ScriptTarget.ES6, true));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = function (rootDir, paths) {
    return paths
        .filter(function (p) { return p.indexOf('.d.') == -1; })
        .map(function (path) { return parseFile(rootDir, path_1.resolve(rootDir, path)); });
};
