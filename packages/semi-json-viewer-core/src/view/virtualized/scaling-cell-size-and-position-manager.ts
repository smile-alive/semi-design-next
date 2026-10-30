//reference from https://github.com/bvaughn/react-virtualized
import { CellSizeAndPositionManager } from './cell-size-and-position-manager';
import type { CellSizeGetter, Alignment, VisibleCellRange } from './types';

type Params = {
    maxScrollSize?: number;
    cellCount: number;
    cellSizeGetter: CellSizeGetter;
    estimatedCellSize: number;
};

type ContainerSizeAndOffset = {
    containerSize: number;
    offset: number;
};

const DEFAULT_MAX_ELEMENT_SIZE = 1500000;
const CHROME_MAX_ELEMENT_SIZE = 1.67771e7;

function isBrowser() {
    return typeof window !== 'undefined';
}

function isChrome() {
    // @ts-ignore
    return !!window.chrome;
}

export function getMaxElementSize(): number {
    if (isBrowser()) {
        if (isChrome()) {
            return CHROME_MAX_ELEMENT_SIZE;
        }
    }
    return DEFAULT_MAX_ELEMENT_SIZE;
}

export class ScalingCellSizeAndPositionManager {
    #maxScrollSize: number;
    #cellSizeAndPositionManager: CellSizeAndPositionManager;

    constructor({ maxScrollSize = getMaxElementSize(), cellCount, cellSizeGetter, estimatedCellSize }: Params) {
        this.#maxScrollSize = maxScrollSize;
        this.#cellSizeAndPositionManager = new CellSizeAndPositionManager({
            cellCount,
            cellSizeGetter,
            estimatedCellSize,
        });
    }

    #getOffsetPercentage({
        containerSize,
        offset, // safe
        totalSize,
    }: {
        containerSize: number;
        offset: number;
        totalSize: number;
    }) {
        return totalSize <= containerSize ? 0 : offset / (totalSize - containerSize);
    }

    #offsetToSafeOffset({
        containerSize,
        offset, // unsafe
    }: ContainerSizeAndOffset) {
        const totalSize = this.#cellSizeAndPositionManager.getTotalSize();
        const safeTotalSize = this.getTotalSize();

        if (totalSize === safeTotalSize) {
            return offset;
        } else {
            const offsetPercentage = this.#getOffsetPercentage({
                containerSize,
                offset,
                totalSize,
            });

            return Math.round(offsetPercentage * (safeTotalSize - containerSize));
        }
    }

    #safeOffsetToOffset({
        containerSize,
        offset, // safe
    }: ContainerSizeAndOffset) {
        const totalSize = this.#cellSizeAndPositionManager.getTotalSize();
        const safeTotalSize = this.getTotalSize();

        if (totalSize === safeTotalSize) {
            return offset;
        } else {
            const offsetPercentage = this.#getOffsetPercentage({
                containerSize,
                offset,
                totalSize: safeTotalSize,
            });

            return Math.round(offsetPercentage * (totalSize - containerSize));
        }
    }

    areOffsetsAdjusted() {
        return this.#cellSizeAndPositionManager.getTotalSize() > this.#maxScrollSize;
    }

    configure(params: { cellCount: number; estimatedCellSize: number; cellSizeGetter: CellSizeGetter }) {
        this.#cellSizeAndPositionManager.configure(params);
    }

    getCellCount() {
        return this.#cellSizeAndPositionManager.getCellCount();
    }

    getEstimatedCellSize() {
        return this.#cellSizeAndPositionManager.getEstimatedCellSize();
    }

    getLastMeasuredIndex() {
        return this.#cellSizeAndPositionManager.getLastMeasuredIndex();
    }

    getOffsetAdjustment({ containerSize, offset }: ContainerSizeAndOffset) {
        const totalSize = this.#cellSizeAndPositionManager.getTotalSize();

        const safeTotalSize = this.getTotalSize();

        const offsetPercentage = this.#getOffsetPercentage({
            containerSize,
            offset,
            totalSize: safeTotalSize,
        });
        return Math.round(offsetPercentage * (safeTotalSize - totalSize));
    }

    getTotalSize() {
        return Math.min(this.#maxScrollSize, this.#cellSizeAndPositionManager.getTotalSize());
    }
    getSizeAndPositionOfCell(index: number) {
        return this.#cellSizeAndPositionManager.getSizeAndPositionOfCell(index);
    }

    getSizeAndPositionOfLastMeasuredCell() {
        return this.#cellSizeAndPositionManager.getSizeAndPositionOfLastMeasuredCell();
    }

    getVisibleCellRange({
        containerSize,
        offset, // safe
    }: ContainerSizeAndOffset): VisibleCellRange {
        offset = this.#safeOffsetToOffset({
            containerSize,
            offset,
        });

        return this.#cellSizeAndPositionManager.getVisibleCellRange({
            containerSize,
            offset,
        });
    }

    resetCell(index: number) {
        this.#cellSizeAndPositionManager.resetCell(index);
    }

    getUpdatedOffsetForIndex({
        align = 'auto',
        containerSize,
        currentOffset, // safe
        targetIndex,
    }: {
        align: Alignment;
        containerSize: number;
        currentOffset: number;
        targetIndex: number;
    }) {
        currentOffset = this.#safeOffsetToOffset({
            containerSize,
            offset: currentOffset,
        });

        const offset = this.#cellSizeAndPositionManager.getUpdatedOffsetForIndex({
            align,
            containerSize,
            currentOffset,
            targetIndex,
        });

        return this.#offsetToSafeOffset({
            containerSize,
            offset,
        });
    }
}
