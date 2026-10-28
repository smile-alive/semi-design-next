import { JSONModel } from './jsonModel';

export function createModel(text: string, normalizeEOL: boolean = true) {
    return new JSONModel(text, normalizeEOL);
}
