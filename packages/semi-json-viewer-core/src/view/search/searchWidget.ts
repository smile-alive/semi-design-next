import type { IModelContentChangeEvent } from '../../common/emitterEvents';
import type { FindMatch } from '../../common/model';
import type { JSONModel } from '../../model/jsonModel';
import type { View } from '../view';

export class SearchWidget {
    #view: View;
    #jsonModel: JSONModel;
    searchResults: FindMatch[] | null = null;
    currentResultIndex: number = -1;
    matchCase: boolean = false;
    wordSeparators: string | null = null;
    isRegex: boolean = false;

    constructor(view: View, jsonModel: JSONModel) {
        this.#view = view;
        this.#jsonModel = jsonModel;
    }

    search(searchText: string, caseSensitive: boolean, wholeWord: boolean, regex: boolean) {
        this.currentResultIndex = -1;
        const isRegex = regex;
        const matchCase = caseSensitive;
        const wordSeparators = !wholeWord ? this.wordSeparators : '`~!@#$%^&*()-=+[{]}\\|;:\'",.<>/?';
        const searchScope = null;
        const captureMatches = false;
        const limitResultCount = Infinity;
        this.searchResults = this.#jsonModel.findMatches(searchText, searchScope, isRegex, matchCase, wordSeparators, captureMatches, limitResultCount);

        this.#view.layout();
    }

    // An empty replaceText deletes the match; only a missing one is ignored
    replace(replaceText: string) {
        if (replaceText === undefined || !this.searchResults) return;
        if (this.currentResultIndex < 0) {
            this.currentResultIndex = 0;
        }
        const currentMatch = this.searchResults[this.currentResultIndex];
        if (!currentMatch) return;
        const startOffset = this.#jsonModel.getOffsetAt(currentMatch.range.startLineNumber, currentMatch.range.startColumn);
        const endOffset = this.#jsonModel.getOffsetAt(currentMatch.range.endLineNumber, currentMatch.range.endColumn);
        const op: IModelContentChangeEvent = {
            range: currentMatch.range,
            newText: replaceText,
            oldText: this.#jsonModel.getValueInRange(currentMatch.range),
            type: 'replace',
            rangeOffset: startOffset,
            rangeLength: endOffset - startOffset,
        };
        this.searchResults.splice(this.currentResultIndex, 1);
        this.#jsonModel.applyOperation(op);
    }

    replaceAll(replaceText: string) {
        if (replaceText === undefined || !this.searchResults?.length) return;
        const op: IModelContentChangeEvent[] = [];
        for (let i = this.searchResults.length - 1; i >= 0; i--) {
            const match = this.searchResults[i];
            const startOffset = this.#jsonModel.getOffsetAt(match.range.startLineNumber, match.range.startColumn);
            const endOffset = this.#jsonModel.getOffsetAt(match.range.endLineNumber, match.range.endColumn);
            op.push({
                range: match.range,
                newText: replaceText,
                oldText: this.#jsonModel.getValueInRange(match.range),
                type: 'replace',
                rangeOffset: startOffset,
                rangeLength: endOffset - startOffset,
            });
        }
        this.searchResults = null;
        this.#jsonModel.applyOperation(op);
    }

    /** Drops the results and their highlights */
    clear() {
        this.searchResults = null;
        this.currentResultIndex = -1;
        this.#view.layout();
    }

    navigateResults(direction: number) {
        if (!this.searchResults || this.searchResults.length === 0) return;

        this.currentResultIndex += direction;
        if (this.currentResultIndex < 0) {
            this.currentResultIndex = this.searchResults.length - 1;
        } else if (this.currentResultIndex >= this.searchResults.length) {
            this.currentResultIndex = 0;
        }
        const currentMatch = this.searchResults[this.currentResultIndex];
        if (!currentMatch) return;
        if (currentMatch.range.startLineNumber > this.#view.startLineNumber + this.#view.visibleLineCount || currentMatch.range.startLineNumber < this.#view.startLineNumber) {
            this.#view.scrollToLine(currentMatch.range.startLineNumber);
        } else {
            this.#view.layout();
        }
    }

    binarySearchByLine(targetLine: number): FindMatch[] | null {
        const matches: FindMatch[] = [];
        if (!this.searchResults) return null;
        let left = 0;
        let right = this.searchResults.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const currentLine = this.searchResults[mid].range.startLineNumber;

            if (currentLine === targetLine) {
                let i = mid;
                while (i >= 0 && this.searchResults[i].range.startLineNumber === targetLine) {
                    matches.unshift(this.searchResults[i]);
                    i--;
                }
                i = mid + 1;
                while (i < this.searchResults.length && this.searchResults[i].range.startLineNumber === targetLine) {
                    matches.push(this.searchResults[i]);
                    i++;
                }
                return matches;
            }

            if (currentLine < targetLine) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return matches;
    }
}
