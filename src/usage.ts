export const USAGE = `
    usage: ts-unused-exports path/to/tsconfig.json [file1.ts file2.ts] [options]
    
    where options are any of:
      --allowUnusedTypes
      --excludeDeclarationFiles
      --excludePathsFromReport=path1;path2
      --exitWithCount
      --ignoreFiles=<regex>
      --ignoreProductionFiles
      --ignoreTestFiles
      --searchNamespaces
      --showLineNumber
      --silent

    Note: if no file is specified after tsconfig, the files will be read from the
    tsconfig's "files" key which must be present.

    If the files are specified, their path must be relative to the tsconfig file.
    For example, given:
      /
      |-- config
      |    \-- tsconfig.json
      \-- src
           \-- file.ts

    Then the usage would be:
      ts-unused-exports config/tsconfig.json ../src/file.ts
    `;
