/** based on https://github.com/microsoft/vscode with modifications for custom requirements */
import { type Emitter, getEmitter } from '../common/emitter';
import type { GlobalEvents, IModelContentChangeEvent } from '../common/emitterEvents';
import type { IRange } from '../common/range';
import { countEOL } from '../common/strings';
import { findFirstIdxMonotonousOrArrLen } from '../common/utils';
import type { FoldingModel } from './foldingModel';

export class HiddenRangeModel {
    #hiddenRanges: IRange[] = [];
    #hasLineChanged: boolean = false;
    #foldingModel: FoldingModel;
    #emitter: Emitter<GlobalEvents> = getEmitter();

    constructor(foldingModel: FoldingModel) {
        this.#foldingModel = foldingModel;
        if (this.#foldingModel.regions.length) {
            this.updateHiddenRanges();
        }
    }

    #applyHiddenRanges(newHiddenAreas: IRange[]) {
        this.#hasLineChanged = false;
        this.#hiddenRanges = newHiddenAreas;
        this.#emitter.emit('forceRender', undefined);
    }

    updateHiddenRanges() {
        let updateHiddenAreas = false;
        const newHiddenAreas: IRange[] = [];
        let i = 0;
        let k = 0;

        let lastCollapsedStart = Number.MAX_VALUE;
        let lastCollapsedEnd = -1;

        const ranges = this.#foldingModel.regions;
        for (; i < ranges.length; i++) {
            if (!ranges.isCollapsed(i)) {
                continue;
            }

            const startLineNumber = ranges.getStartLineNumber(i) + 1; // the first line stays visible
            const endLineNumber = ranges.getEndLineNumber(i);
            if (lastCollapsedStart <= startLineNumber && endLineNumber <= lastCollapsedEnd) {
                continue;
            }

            if (!updateHiddenAreas && k < this.#hiddenRanges.length && this.#hiddenRanges[k].startLineNumber === startLineNumber && this.#hiddenRanges[k].endLineNumber === endLineNumber) {
                newHiddenAreas.push(this.#hiddenRanges[k]);
                k++;
            } else {
                updateHiddenAreas = true;
                newHiddenAreas.push({ startLineNumber, startColumn: 1, endLineNumber, endColumn: 1 });
            }
            lastCollapsedStart = startLineNumber;
            lastCollapsedEnd = endLineNumber;
        }
        if (this.#hasLineChanged || updateHiddenAreas || k < this.#hiddenRanges.length) {
            this.#applyHiddenRanges(newHiddenAreas);
        }
    }

    get hiddenRanges() {
        return this.#hiddenRanges;
    }

    isHiddenLine(lineNumber: number) {
        return this.findRange(lineNumber, this.#hiddenRanges) !== null;
    }

    findRange(lineNumber: number, ranges: IRange[]): IRange | null {
        const i = findFirstIdxMonotonousOrArrLen(ranges, (r) => lineNumber < r.startLineNumber) - 1;
        if (i >= 0 && ranges[i].endLineNumber >= lineNumber) {
            return ranges[i];
        }
        return null;
    }
    getHiddenLineCount() {
        let count = 0;
        for (const range of this.#hiddenRanges) {
            count += range.endLineNumber - range.startLineNumber + 1;
        }
        return count;
    }

    notifyChangeModelContent(e: IModelContentChangeEvent | IModelContentChangeEvent[]) {
        if (this.#hiddenRanges.length && !this.#hasLineChanged) {
            if (Array.isArray(e)) {
                this.#hasLineChanged = e.some((change) => {
                    return change.range.endLineNumber !== change.range.startLineNumber || countEOL(change.newText)[0] !== 0 || countEOL(change.oldText)[0] !== 0;
                });
            } else {
                this.#hasLineChanged = e.range.endLineNumber !== e.range.startLineNumber || countEOL(e.newText)[0] !== 0 || countEOL(e.oldText)[0] !== 0;
            }
        }
    }
}
