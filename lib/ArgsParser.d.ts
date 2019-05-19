import { ExtraCommandLineOptions } from "./types";
export declare type TsFilesAndOptions = {
    tsFiles?: string[];
    options: ExtraCommandLineOptions;
};
declare const _default: (files?: string[] | undefined) => TsFilesAndOptions;
export default _default;
