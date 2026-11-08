import { type FormattingOptions, format } from 'jsonc-parser';
import type { JSONModel } from '../model/json-model';
import { parseJson } from './parse';
export { getFoldingRanges } from './get-range';

export interface FoldingRange {
    startLine: number;
    endLine: number;
    kind: 'object' | 'array';
}

export function formatJson(jsonModel: JSONModel, options: FormattingOptions) {
    const edits = format(jsonModel.getValue(), undefined, options);
    return edits;
}

export function doValidate(jsonModel: JSONModel) {
    const { root, problems } = parseJson(jsonModel);
    return {
        problems,
        root,
    };
}

export function parseJsonAst(jsonModel: JSONModel) {
    return parseJson(jsonModel).root;
}
