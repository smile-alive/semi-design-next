/** reference from https://github.com/microsoft/vscode */
export interface ILineRange {
    startLineNumber: number;
    endLineNumber: number;
}

export const enum FoldSource {
    provider = 0,
    userDefined = 1,
    recovered = 2,
}

export const foldSourceAbbr = {
    [FoldSource.provider]: ' ',
    [FoldSource.userDefined]: 'u',
    [FoldSource.recovered]: 'r',
};

export interface FoldRange {
    startLineNumber: number;
    endLineNumber: number;
    type?: string;
    isCollapsed: boolean;
    source: FoldSource;
}

export const MAX_FOLDING_REGIONS = 0xffff;
export const MAX_LINE_NUMBER = 0xffffff;

const MASK_INDENT = 0xff000000;

class BitField {
    readonly #states: Uint32Array;
    constructor(size: number) {
        const numWords = Math.ceil(size / 32);
        this.#states = new Uint32Array(numWords);
    }

    get(index: number) {
        const arrayIndex = (index / 32) | 0;
        const bit = index % 32;
        return (this.#states[arrayIndex] & (1 << bit)) !== 0;
    }

    set(index: number, newState: boolean) {
        const arrayIndex = (index / 32) | 0;
        const bit = index % 32;
        const value = this.#states[arrayIndex];
        if (newState) {
            this.#states[arrayIndex] = value | (1 << bit);
        } else {
            this.#states[arrayIndex] = value & ~(1 << bit);
        }
    }
}

export class FoldingRegions {
    readonly #startIndexes: Uint32Array;
    readonly #endIndexes: Uint32Array;
    readonly #collapseStates: BitField;
    readonly #userDefinedStates: BitField;
    readonly #recoveredStates: BitField;
    #parentsComputed: boolean;
    readonly #types: Array<string | undefined> | undefined;

    constructor(startIndexes: Uint32Array, endIndexes: Uint32Array, types?: Array<string | undefined>) {
        if (startIndexes.length !== endIndexes.length || startIndexes.length > MAX_FOLDING_REGIONS) {
            throw new Error('invalid startIndexes or endIndexes size');
        }
        this.#startIndexes = startIndexes;
        this.#endIndexes = endIndexes;
        this.#collapseStates = new BitField(startIndexes.length);
        this.#userDefinedStates = new BitField(startIndexes.length);
        this.#recoveredStates = new BitField(startIndexes.length);
        this.#types = types;
        this.#parentsComputed = false;
    }

    #ensureParentIndices() {
        if (!this.#parentsComputed) {
            this.#parentsComputed = true;
            const parentIndexes: number[] = [];
            const isInsideLast = (startLineNumber: number, endLineNumber: number) => {
                const index = parentIndexes[parentIndexes.length - 1];
                return this.getStartLineNumber(index) <= startLineNumber && this.getEndLineNumber(index) >= endLineNumber;
            };
            for (let i = 0, len = this.#startIndexes.length; i < len; i++) {
                const startLineNumber = this.#startIndexes[i];
                const endLineNumber = this.#endIndexes[i];
                if (startLineNumber > MAX_LINE_NUMBER || endLineNumber > MAX_LINE_NUMBER) {
                    throw new Error('startLineNumber or endLineNumber must not exceed ' + MAX_LINE_NUMBER);
                }
                while (parentIndexes.length > 0 && !isInsideLast(startLineNumber, endLineNumber)) {
                    parentIndexes.pop();
                }
                const parentIndex = parentIndexes.length > 0 ? parentIndexes[parentIndexes.length - 1] : -1;
                parentIndexes.push(i);
                this.#startIndexes[i] = startLineNumber + ((parentIndex & 0xff) << 24);
                this.#endIndexes[i] = endLineNumber + ((parentIndex & 0xff00) << 16);
            }
        }
    }

    #isUserDefined(index: number) {
        return this.#userDefinedStates.get(index);
    }

    #setUserDefined(index: number, newState: boolean) {
        return this.#userDefinedStates.set(index, newState);
    }

    #isRecovered(index: number) {
        return this.#recoveredStates.get(index);
    }

    #setRecovered(index: number, newState: boolean) {
        return this.#recoveredStates.set(index, newState);
    }

    #findIndex(line: number) {
        let low = 0,
            high = this.#startIndexes.length;
        if (high === 0) {
            return -1;
        }
        while (low < high) {
            const mid = Math.floor((low + high) / 2);
            if (line < this.getStartLineNumber(mid)) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        return low - 1;
    }

    static fromFoldRanges(ranges: FoldRange[]) {
        ranges = ranges.toSorted((a, b) => a.startLineNumber - b.startLineNumber);
        const rangesLength = ranges.length;
        const startIndexes = new Uint32Array(rangesLength);
        const endIndexes = new Uint32Array(rangesLength);
        let types: Array<string | undefined> | undefined = [];
        let gotTypes = false;
        for (let i = 0; i < rangesLength; i++) {
            const range = ranges[i];
            startIndexes[i] = range.startLineNumber;
            endIndexes[i] = range.endLineNumber;
            types.push(range.type);
            if (range.type) {
                gotTypes = true;
            }
        }
        if (!gotTypes) {
            types = undefined;
        }
        const regions = new FoldingRegions(startIndexes, endIndexes, types);
        for (let i = 0; i < rangesLength; i++) {
            if (ranges[i].isCollapsed) {
                regions.setCollapsed(i, true);
            }
            regions.setSource(i, ranges[i].source);
        }
        return regions;
    }

    /**
     * Two inputs, each a FoldingRegions or a FoldRange[], are merged.
     * Each input must be pre-sorted on startLineNumber.
     * The first list is assumed to always include all regions currently defined by range providers.
     * The second list only contains the previously collapsed and all manual ranges.
     * If the line position matches, the range of the new range is taken, and the range is no longer manual
     * When an entry in one list overlaps an entry in the other, the second list's entry "wins" and
     * overlapping entries in the first list are discarded.
     * Invalid entries are discarded. An entry is invalid if:
     * 		the start and end line numbers aren't a valid range of line numbers,
     * 		it is out of sequence or has the same start line as a preceding entry,
     * 		it overlaps a preceding entry and is not fully contained by that entry.
     */
    static sanitizeAndMerge(rangesA: FoldingRegions | FoldRange[], rangesB: FoldingRegions | FoldRange[], maxLineNumber?: number) {
        maxLineNumber = maxLineNumber ?? Number.MAX_VALUE;

        const getIndexedFunction = (r: FoldingRegions | FoldRange[], limit: number) => {
            return Array.isArray(r)
                ? (i: number) => {
                      return i < limit ? r[i] : undefined;
                  }
                : (i: number) => {
                      return i < limit ? r.toFoldRange(i) : undefined;
                  };
        };
        const getA = getIndexedFunction(rangesA, rangesA.length);
        const getB = getIndexedFunction(rangesB, rangesB.length);
        let indexA = 0;
        let indexB = 0;
        let nextA = getA(0);
        let nextB = getB(0);

        const stackedRanges: FoldRange[] = [];
        let topStackedRange: FoldRange | undefined;
        let prevLineNumber = 0;
        const resultRanges: FoldRange[] = [];

        while (nextA || nextB) {
            let useRange: FoldRange | undefined = undefined;
            if (nextB && (!nextA || nextA.startLineNumber >= nextB.startLineNumber)) {
                if (nextA && nextA.startLineNumber === nextB.startLineNumber) {
                    if (nextB.source === FoldSource.userDefined) {
                        useRange = nextB;
                    } else {
                        useRange = nextA;
                        useRange.isCollapsed = nextB.isCollapsed && nextA.endLineNumber === nextB.endLineNumber;
                        useRange.source = FoldSource.provider;
                    }
                    nextA = getA(++indexA);
                } else {
                    useRange = nextB;
                    if (nextB.isCollapsed && nextB.source === FoldSource.provider) {
                        useRange.source = FoldSource.recovered;
                    }
                }
                nextB = getB(++indexB);
            } else {
                // the user folded B set takes precedence, so look ahead in it for an upcoming conflict
                let scanIndex = indexB;
                let prescanB = nextB;
                while (true) {
                    if (!prescanB || prescanB.startLineNumber > nextA.endLineNumber) {
                        useRange = nextA;
                        break;
                    }
                    if (prescanB.source === FoldSource.userDefined && prescanB.endLineNumber > nextA.endLineNumber) {
                        // a user folded range wins; nextA is skipped
                        break;
                    }
                    prescanB = getB(++scanIndex);
                }
                nextA = getA(++indexA);
            }

            if (useRange) {
                while (topStackedRange && topStackedRange.endLineNumber < useRange.startLineNumber) {
                    topStackedRange = stackedRanges.pop();
                }
                if (useRange.endLineNumber > useRange.startLineNumber && useRange.startLineNumber > prevLineNumber && useRange.endLineNumber <= maxLineNumber && (!topStackedRange || topStackedRange.endLineNumber >= useRange.endLineNumber)) {
                    resultRanges.push(useRange);
                    prevLineNumber = useRange.startLineNumber;
                    if (topStackedRange) {
                        stackedRanges.push(topStackedRange);
                    }
                    topStackedRange = useRange;
                }
            }
        }
        return resultRanges;
    }

    get length() {
        return this.#startIndexes.length;
    }

    getStartLineNumber(index: number) {
        return this.#startIndexes[index] & MAX_LINE_NUMBER;
    }

    getEndLineNumber(index: number) {
        return this.#endIndexes[index] & MAX_LINE_NUMBER;
    }

    getType(index: number): string | undefined {
        return this.#types ? this.#types[index] : undefined;
    }

    hasTypes() {
        return !!this.#types;
    }

    isCollapsed(index: number) {
        return this.#collapseStates.get(index);
    }

    setCollapsed(index: number, newState: boolean) {
        this.#collapseStates.set(index, newState);
    }

    getSource(index: number) {
        if (this.#isUserDefined(index)) {
            return FoldSource.userDefined;
        } else if (this.#isRecovered(index)) {
            return FoldSource.recovered;
        }
        return FoldSource.provider;
    }

    setSource(index: number, source: FoldSource) {
        if (source === FoldSource.userDefined) {
            this.#setUserDefined(index, true);
            this.#setRecovered(index, false);
        } else if (source === FoldSource.recovered) {
            this.#setUserDefined(index, false);
            this.#setRecovered(index, true);
        } else {
            this.#setUserDefined(index, false);
            this.#setRecovered(index, false);
        }
    }

    setCollapsedAllOfType(type: string, newState: boolean) {
        let hasChanged = false;
        if (this.#types) {
            for (let i = 0; i < this.#types.length; i++) {
                if (this.#types[i] === type) {
                    this.setCollapsed(i, newState);
                    hasChanged = true;
                }
            }
        }
        return hasChanged;
    }

    toRegion(index: number) {
        return new FoldingRegion(this, index);
    }

    getParentIndex(index: number) {
        this.#ensureParentIndices();
        const parent = ((this.#startIndexes[index] & MASK_INDENT) >>> 24) + ((this.#endIndexes[index] & MASK_INDENT) >>> 16);
        if (parent === MAX_FOLDING_REGIONS) {
            return -1;
        }
        return parent;
    }

    contains(index: number, line: number) {
        return this.getStartLineNumber(index) <= line && this.getEndLineNumber(index) >= line;
    }

    findRange(line: number) {
        let index = this.#findIndex(line);
        if (index >= 0) {
            const endLineNumber = this.getEndLineNumber(index);
            if (endLineNumber >= line) {
                return index;
            }
            index = this.getParentIndex(index);
            while (index !== -1) {
                if (this.contains(index, line)) {
                    return index;
                }
                index = this.getParentIndex(index);
            }
        }
        return -1;
    }

    toFoldRange(index: number): FoldRange {
        return {
            startLineNumber: this.#startIndexes[index] & MAX_LINE_NUMBER,
            endLineNumber: this.#endIndexes[index] & MAX_LINE_NUMBER,
            type: this.#types ? this.#types[index] : undefined,
            isCollapsed: this.isCollapsed(index),
            source: this.getSource(index),
        };
    }
}

export class FoldingRegion {
    readonly #ranges: FoldingRegions;
    #index: number;

    constructor(ranges: FoldingRegions, index: number) {
        this.#ranges = ranges;
        this.#index = index;
    }

    get startLineNumber() {
        return this.#ranges.getStartLineNumber(this.#index);
    }

    get endLineNumber() {
        return this.#ranges.getEndLineNumber(this.#index);
    }

    get regionIndex() {
        return this.#index;
    }

    get parentIndex() {
        return this.#ranges.getParentIndex(this.#index);
    }

    get isCollapsed() {
        return this.#ranges.isCollapsed(this.#index);
    }

    containedBy(range: ILineRange) {
        return range.startLineNumber <= this.startLineNumber && range.endLineNumber >= this.endLineNumber;
    }
    containsLine(lineNumber: number) {
        return this.startLineNumber <= lineNumber && lineNumber <= this.endLineNumber;
    }
    hidesLine(lineNumber: number) {
        return this.startLineNumber < lineNumber && lineNumber <= this.endLineNumber;
    }
}
