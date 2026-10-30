import { JSONModel } from './json-model';

export function createModel(text: string, normalizeEOL: boolean = true) {
    return new JSONModel(text, normalizeEOL);
}
