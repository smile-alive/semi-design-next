//reference from https://github.com/bvaughn/react-virtualized
import type { Alignment, CellSizeGetter, VisibleCellRange } from './types';

type CellSizeAndPositionManagerParams = {
    cellCount: number;
    cellSizeGetter: CellSizeGetter;
    estimatedCellSize: number;
};

type GetUpdatedOffsetForIndex = {
    align: Alignment;
    containerSize: number;
    currentOffset: number;
    targetIndex: number;
};

type SizeAndPositionData = {
    offset: number;
    size: number;
};

type GetVisibleCellRangeParams = {
    containerSize: number;
    offset: number;
};

export class CellSizeAndPositionManager {
    #cellCount: number;
    #cellSizeGetter: CellSizeGetter;
    #estimatedCellSize: number;
    #lastMeasuredIndex = -1;
    #cellSizeAndPositionData: Record<number, SizeAndPositionData> = {};

    constructor(params: CellSizeAndPositionManagerParams) {
        this.#cellCount = params.cellCount;
        this.#cellSizeGetter = params.cellSizeGetter;
        this.#estimatedCellSize = params.estimatedCellSize;
    }

    #binarySearch(high: number, low: number, offset: number) {
        while (low <= high) {
            const middle = low + Math.floor((high - low) / 2);
            const currentOffset = this.getSizeAndPositionOfCell(middle).offset;

            if (currentOffset === offset) {
                return middle;
            } else if (currentOffset < offset) {
                low = middle + 1;
            } else if (currentOffset > offset) {
                high = middle - 1;
            }
        }

        if (low > 0) {
            return low - 1;
        } else {
            return 0;
        }
    }

    #exponentialSearch(index: number, offset: number) {
        let interval = 1;

        while (index < this.#cellCount && this.getSizeAndPositionOfCell(index).offset < offset) {
            index += interval;
            interval *= 2;
        }

        return this.#binarySearch(Math.min(index, this.#cellCount - 1), Math.floor(index / 2), offset);
    }

    #findNearestCell(offset: number) {
        if (isNaN(offset)) {
            throw new Error('offset is NaN');
        }
        offset = Math.max(0, offset);
        const lastMeasuredCellSizeAndPosition = this.getSizeAndPositionOfLastMeasuredCell();
        const lastMeasuredIndex = Math.max(0, this.#lastMeasuredIndex);

        if (lastMeasuredCellSizeAndPosition.offset >= offset) {
            return this.#binarySearch(lastMeasuredIndex, 0, offset);
        } else {
            return this.#exponentialSearch(lastMeasuredIndex, offset);
        }
    }

    areOffsetsAdjusted() {
        return false;
    }

    configure(params: CellSizeAndPositionManagerParams) {
        this.#cellCount = params.cellCount;
        this.#cellSizeGetter = params.cellSizeGetter;
        this.#estimatedCellSize = params.estimatedCellSize;
    }

    getCellCount() {
        return this.#cellCount;
    }

    getEstimatedCellSize() {
        return this.#estimatedCellSize;
    }

    getLastMeasuredIndex() {
        return this.#lastMeasuredIndex;
    }

    getOffsetAdjustment() {
        return 0;
    }

    getSizeAndPositionOfCell(index: number) {
        if (index < 0 || index >= this.#cellCount) {
            throw new Error('index out of bounds');
        }

        if (index > this.#lastMeasuredIndex) {
            const lastMeasuredCellSizeAndPosition = this.getSizeAndPositionOfLastMeasuredCell();
            let offset = lastMeasuredCellSizeAndPosition.offset + lastMeasuredCellSizeAndPosition.size;
            for (let i = this.#lastMeasuredIndex + 1; i <= index; i++) {
                const size = this.#cellSizeGetter({ index: i });
                if (size === undefined || isNaN(size)) {
                    throw new Error('invalid size');
                } else if (size === null) {
                    this.#cellSizeAndPositionData[i] = {
                        offset,
                        size: 0,
                    };
                } else {
                    this.#cellSizeAndPositionData[i] = {
                        offset,
                        size,
                    };
                    offset += size;
                    this.#lastMeasuredIndex = index;
                }
            }
        }
        return this.#cellSizeAndPositionData[index];
    }

    getSizeAndPositionOfLastMeasuredCell() {
        return this.#lastMeasuredIndex >= 0 ? this.#cellSizeAndPositionData[this.#lastMeasuredIndex] : { offset: 0, size: 0 };
    }

    getTotalSize() {
        const lastMeasuredCellSizeAndPosition = this.getSizeAndPositionOfLastMeasuredCell();
        const totalSizeOfMeasuredCells = lastMeasuredCellSizeAndPosition.offset + lastMeasuredCellSizeAndPosition.size;
        const numUnmeasuredCells = this.#cellCount - this.#lastMeasuredIndex - 1;
        const totalSizeOfUnmeasuredCells = numUnmeasuredCells * this.#estimatedCellSize;
        return totalSizeOfMeasuredCells + totalSizeOfUnmeasuredCells;
    }

    getUpdatedOffsetForIndex({ align, containerSize, currentOffset, targetIndex }: GetUpdatedOffsetForIndex) {
        if (currentOffset < 0) {
            return 0;
        }
        const datum = this.getSizeAndPositionOfCell(targetIndex);
        const maxOffset = datum.offset;
        const minOffset = maxOffset - containerSize + datum.size;
        let idealOffset = currentOffset;
        switch (align) {
            case 'start':
                idealOffset = maxOffset;
                break;
            case 'end':
                idealOffset = minOffset;
                break;
            case 'center':
                idealOffset = maxOffset - (containerSize - datum.size) / 2;
                break;
            default:
                idealOffset = Math.max(minOffset, Math.min(maxOffset, currentOffset));
                break;
        }
        const totalSize = this.getTotalSize();
        return Math.max(0, Math.min(idealOffset, totalSize - containerSize));
    }

    getVisibleCellRange(params: GetVisibleCellRangeParams): VisibleCellRange {
        const containerSize = params.containerSize;
        let offset = params.offset;
        const totalSize = this.getTotalSize();
        if (totalSize === 0) {
            return {};
        }
        const maxOffset = offset + containerSize;
        const start = this.#findNearestCell(offset);
        const datum = this.getSizeAndPositionOfCell(start);

        offset = datum.offset + datum.size;

        let stop = start;
        while (offset < maxOffset && stop < this.#cellCount - 1) {
            stop++;
            offset += this.getSizeAndPositionOfCell(stop).size;
        }
        return {
            start,
            stop,
        };
    }

    resetCell(index: number) {
        this.#lastMeasuredIndex = Math.min(this.#lastMeasuredIndex, index - 1);
    }
}
