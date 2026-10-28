import { type Emitter, getEmitter } from '../common/emitter';
import type { GlobalEvents } from '../common/emitterEvents';
import { type JsonWorkerManager, getJsonWorkerManager } from '../worker/jsonWorkerManager';
import { type FoldingRegion, type FoldRange, FoldingRegions, FoldSource } from './foldingRange';
import { HiddenRangeModel } from './hiddenRangeModel';
/** based on https://github.com/microsoft/vscode with modifications for custom requirements */
import type { JSONModel } from './jsonModel';

export class FoldingModel {
    #jsonModel: JSONModel;
    #regions: FoldingRegions | null = null;
    #hiddenRangeModel: HiddenRangeModel;
    #jsonWorkerManager: JsonWorkerManager = getJsonWorkerManager();
    #emitter: Emitter<GlobalEvents> = getEmitter();

    constructor(jsonModel: JSONModel) {
        this.#jsonModel = jsonModel;
        this.updateFoldingRanges();
        this.#emitter.on('contentChanged', (e) => {
            this.#hiddenRangeModel.notifyChangeModelContent(e);
        });

        this.#emitter.on('problemsChanged', () => {
            void this.#jsonWorkerManager.foldRange().then((ranges) => {
                const newRegions = FoldingRegions.fromFoldRanges(ranges);
                this.update(newRegions);
                this.#hiddenRangeModel.updateHiddenRanges();
            });
        });
    }

    #currentFoldedOrManualRanges(blockedLineNumers: number[] = [], newRegions?: FoldingRegions) {
        const isBlocked = (startLineNumber: number, endLineNumber: number) => {
            if (newRegions) {
                const index = newRegions.findRange(startLineNumber);
                if (index === -1) return true;

                const region = newRegions.toRegion(index);
                if (!region || region.endLineNumber !== endLineNumber) return true;
            }

            for (const blockedLineNumber of blockedLineNumers) {
                if (startLineNumber < blockedLineNumber && blockedLineNumber <= endLineNumber) {
                    return true;
                }
            }
            return false;
        };

        const foldedRanges: FoldRange[] = [];
        for (let i = 0; i < this.#regions.length; i++) {
            if (this.#regions.isCollapsed(i)) {
                const startLineNumber = this.#regions.getStartLineNumber(i);
                const endLineNumber = this.#regions.getEndLineNumber(i);

                if (!isBlocked(startLineNumber, endLineNumber)) {
                    foldedRanges.push({
                        startLineNumber,
                        endLineNumber,
                        isCollapsed: true,
                        source: FoldSource.provider,
                        type: this.#regions.getType(i),
                    });
                }
            }
        }
        return foldedRanges;
    }

    get regions() {
        return this.#regions;
    }

    updateFoldingRanges() {
        void this.#jsonWorkerManager.foldRange().then((ranges) => {
            this.#regions = FoldingRegions.fromFoldRanges(ranges);
            this.#hiddenRangeModel = new HiddenRangeModel(this);
        });
    }

    update(newRegions: FoldingRegions, blockedLineNumers: number[] = []) {
        const foldedOrManualRanges = this.#currentFoldedOrManualRanges(blockedLineNumers, newRegions);
        const newRanges = FoldingRegions.sanitizeAndMerge(newRegions, foldedOrManualRanges, this.#jsonModel.getLineCount());
        this.#regions = FoldingRegions.fromFoldRanges(newRanges);
    }

    toggleCollapseState(toggledRegions: FoldingRegion[]) {
        if (!toggledRegions.length) {
            return;
        }
        toggledRegions = toggledRegions.sort((r1, r2) => r1.regionIndex - r2.regionIndex);
        for (const region of toggledRegions) {
            const index = region.regionIndex;
            const newCollapsed = !this.#regions.isCollapsed(index);
            this.#regions.setCollapsed(index, newCollapsed);
        }
        this.#hiddenRangeModel.updateHiddenRanges();
    }

    toggleFoldingRange(startLine: number) {
        toggleCollapseState(this, 1, [startLine]);
    }

    isCollapsed(lineNumber: number) {
        if (!this.#regions) return false;
        const index = this.#regions.findRange(lineNumber);
        const region = this.#regions.toRegion(index);
        return region && region.isCollapsed;
    }

    isLineCollapsed(lineNumber: number) {
        if (!this.#regions) return false;
        return this.#hiddenRangeModel.isHiddenLine(lineNumber);
    }

    isFoldable(lineNumber: number) {
        if (!this.#regions) return false;
        const index = this.#regions.findRange(lineNumber);
        const region = this.#regions.toRegion(index);
        return region && region.startLineNumber === lineNumber;
    }

    getVisibleLineCount() {
        if (!this.#regions || !this.#hiddenRangeModel) return this.#jsonModel.getLineCount();
        return this.#jsonModel.getLineCount() - this.#hiddenRangeModel.getHiddenLineCount();
    }

    getActualLineNumber(visibleLineNumber: number) {
        if (!this.#regions || !this.#hiddenRangeModel) return visibleLineNumber;

        let actualLine = visibleLineNumber;
        const hiddenRanges = this.#hiddenRangeModel.hiddenRanges;
        for (const range of hiddenRanges) {
            if (range.startLineNumber <= actualLine) {
                actualLine += range.endLineNumber - range.startLineNumber + 1;
            } else {
                break;
            }
        }
        return actualLine;
    }

    getNextVisibleLine(actualLineNumber: number) {
        if (!this.#regions || !this.#hiddenRangeModel) return actualLineNumber + 1;
        let nextLine = actualLineNumber + 1;
        const hiddenRanges = this.#hiddenRangeModel.hiddenRanges;
        const containingRange = this.#hiddenRangeModel.findRange(nextLine, hiddenRanges);
        if (containingRange) {
            return containingRange.endLineNumber + 1;
        }
        return nextLine;
    }

    getRegionAtLine(lineNumber: number): FoldingRegion | null {
        if (this.#regions) {
            const index = this.#regions.findRange(lineNumber);
            if (index >= 0) {
                return this.#regions.toRegion(index);
            }
        }
        return null;
    }

    getRegionsInside(region: FoldingRegion | null, filter?: RegionFilter | RegionFilterWithLevel) {
        const result: FoldingRegion[] = [];
        const index = region ? region.regionIndex + 1 : 0;
        const endLineNumber = region ? region.endLineNumber : Number.MAX_VALUE;

        if (filter && filter.length === 2) {
            const levelStack: FoldingRegion[] = [];
            for (let i = index, len = this.#regions.length; i < len; i++) {
                const current = this.#regions.toRegion(i);
                if (this.#regions.getStartLineNumber(i) < endLineNumber) {
                    while (levelStack.length > 0 && !current.containedBy(levelStack[levelStack.length - 1])) {
                        levelStack.pop();
                    }
                    levelStack.push(current);
                    if (filter(current, levelStack.length)) {
                        result.push(current);
                    }
                } else {
                    break;
                }
            }
        } else {
            for (let i = index, len = this.#regions.length; i < len; i++) {
                const current = this.#regions.toRegion(i);
                if (this.#regions.getStartLineNumber(i) < endLineNumber) {
                    if (!filter || (filter as RegionFilter)(current)) {
                        result.push(current);
                    }
                } else {
                    break;
                }
            }
        }
        return result;
    }
}

type RegionFilter = (r: FoldingRegion) => boolean;
type RegionFilterWithLevel = (r: FoldingRegion, level: number) => boolean;

/**
 * Collapse or expand the regions at the given locations
 * @param levels The number of levels. Use 1 to only impact the regions at the location, use Number.MAX_VALUE for all levels.
 * @param lineNumbers the location of the regions to collapse or expand, or if not set, all regions in the model.
 */
export function toggleCollapseState(foldingModel: FoldingModel, levels: number, lineNumbers: number[]) {
    const toToggle: FoldingRegion[] = [];
    for (const lineNumber of lineNumbers) {
        const region = foldingModel.getRegionAtLine(lineNumber);
        if (region) {
            const doCollapse = !region.isCollapsed;
            toToggle.push(region);
            if (levels > 1) {
                const regionsInside = foldingModel.getRegionsInside(region, (r, level: number) => r.isCollapsed !== doCollapse && level < levels);
                toToggle.push(...regionsInside);
            }
        }
    }
    foldingModel.toggleCollapseState(toToggle);
}
