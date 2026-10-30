/** Based on https://github.com/microsoft/vscode-json-languageservice with modifications for custom requirements */

import { createScanner, SyntaxKind } from 'jsonc-parser';
import { type FoldRange, FoldSource } from '../model/folding-range';
import type { JSONModel } from '../model/json-model';

export function getFoldingRanges(jsonModel: JSONModel) {
    const ranges: FoldRange[] = [];
    const stack: Omit<FoldRange, 'endLineNumber' | 'isCollapsed' | 'source'>[] = [];
    let prevStart = -1;
    const scanner = createScanner(jsonModel.getValue(), false);
    let token = scanner.scan();

    const addRange = (range: FoldRange) => {
        ranges.push(range);
    };

    while (token !== SyntaxKind.EOF) {
        switch (token) {
            case SyntaxKind.OpenBraceToken:
            case SyntaxKind.OpenBracketToken: {
                const startLineNumber = jsonModel.positionAt(scanner.getPosition()).lineNumber;
                const range = {
                    startLineNumber,
                    type: token === SyntaxKind.OpenBraceToken ? 'object' : 'array',
                };
                stack.push(range);
                break;
            }
            case SyntaxKind.CloseBraceToken:
            case SyntaxKind.CloseBracketToken: {
                const type = token === SyntaxKind.CloseBraceToken ? 'object' : 'array';
                if (stack.length > 0 && stack[stack.length - 1].type === type) {
                    const range = stack.pop();
                    const endLineNumber = jsonModel.positionAt(scanner.getTokenOffset()).lineNumber;

                    if (range && endLineNumber > range.startLineNumber + 1 && prevStart !== range.startLineNumber) {
                        const foldRange: FoldRange = {
                            startLineNumber: range.startLineNumber,
                            endLineNumber: endLineNumber - 1,
                            type: range.type,
                            isCollapsed: false,
                            source: FoldSource.provider,
                        };
                        addRange(foldRange);
                        prevStart = range.startLineNumber;
                    }
                }
                break;
            }
        }
        token = scanner.scan();
    }
    return ranges;
}
