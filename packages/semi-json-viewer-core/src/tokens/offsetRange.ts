/** reference from https://github.com/microsoft/vscode */
export interface IOffsetRange {
    readonly start: number;
    readonly endExclusive: number;
}

/**
 * A range of offsets (0-based).
 */
export class OffsetRange implements IOffsetRange {
    readonly start: number;
    readonly endExclusive: number;

    constructor(start: number, endExclusive: number) {
        this.start = start;
        this.endExclusive = endExclusive;
        if (start > endExclusive) {
            throw new Error(`Invalid range: ${this.toString()}`);
        }
    }

    static addRange(range: OffsetRange, sortedRanges: OffsetRange[]) {
        let i = 0;
        while (i < sortedRanges.length && sortedRanges[i].endExclusive < range.start) {
            i++;
        }
        let j = i;
        while (j < sortedRanges.length && sortedRanges[j].start <= range.endExclusive) {
            j++;
        }
        if (i === j) {
            sortedRanges.splice(i, 0, range);
        } else {
            const start = Math.min(range.start, sortedRanges[i].start);
            const end = Math.max(range.endExclusive, sortedRanges[j - 1].endExclusive);
            sortedRanges.splice(i, j - i, new OffsetRange(start, end));
        }
    }

    static tryCreate(start: number, endExclusive: number): OffsetRange | undefined {
        if (start > endExclusive) {
            return undefined;
        }
        return new OffsetRange(start, endExclusive);
    }

    static ofLength(length: number) {
        return new OffsetRange(0, length);
    }

    static ofStartAndLength(start: number, length: number) {
        return new OffsetRange(start, start + length);
    }

    get isEmpty() {
        return this.start === this.endExclusive;
    }

    delta(offset: number) {
        return new OffsetRange(this.start + offset, this.endExclusive + offset);
    }

    deltaStart(offset: number) {
        return new OffsetRange(this.start + offset, this.endExclusive);
    }

    deltaEnd(offset: number) {
        return new OffsetRange(this.start, this.endExclusive + offset);
    }

    get length() {
        return this.endExclusive - this.start;
    }

    toString() {
        return `[${this.start}, ${this.endExclusive})`;
    }

    equals(other: OffsetRange) {
        return this.start === other.start && this.endExclusive === other.endExclusive;
    }

    containsRange(other: OffsetRange) {
        return this.start <= other.start && other.endExclusive <= this.endExclusive;
    }

    contains(offset: number) {
        return this.start <= offset && offset < this.endExclusive;
    }

    /**
     * for all numbers n: range1.contains(n) or range2.contains(n) => range1.join(range2).contains(n)
     * The joined range is the smallest range that contains both ranges.
     */
    join(other: OffsetRange) {
        return new OffsetRange(Math.min(this.start, other.start), Math.max(this.endExclusive, other.endExclusive));
    }

    /**
     * for all numbers n: range1.contains(n) and range2.contains(n) <=> range1.intersect(range2).contains(n)
     *
     * The resulting range is empty if the ranges do not intersect, but touch.
     * If the ranges don't even touch, the result is undefined.
     */
    intersect(other: OffsetRange): OffsetRange | undefined {
        const start = Math.max(this.start, other.start);
        const end = Math.min(this.endExclusive, other.endExclusive);
        if (start <= end) {
            return new OffsetRange(start, end);
        }
        return undefined;
    }

    intersects(other: OffsetRange) {
        const start = Math.max(this.start, other.start);
        const end = Math.min(this.endExclusive, other.endExclusive);
        return start < end;
    }

    intersectsOrTouches(other: OffsetRange) {
        const start = Math.max(this.start, other.start);
        const end = Math.min(this.endExclusive, other.endExclusive);
        return start <= end;
    }

    isBefore(other: OffsetRange) {
        return this.endExclusive <= other.start;
    }

    isAfter(other: OffsetRange) {
        return this.start >= other.endExclusive;
    }

    slice<T>(arr: T[]) {
        return arr.slice(this.start, this.endExclusive);
    }

    substring(str: string) {
        return str.substring(this.start, this.endExclusive);
    }

    /**
     * Returns the given value if it is contained in this instance, otherwise the closest value that is contained.
     * The range must not be empty.
     */
    clip(value: number) {
        if (this.isEmpty) {
            throw new Error(`Invalid clipping range: ${this.toString()}`);
        }
        return Math.max(this.start, Math.min(this.endExclusive - 1, value));
    }

    /**
     * Returns `r := value + k * length` such that `r` is contained in this range.
     * The range must not be empty.
     *
     * E.g. `[5, 10).clipCyclic(10) === 5`, `[5, 10).clipCyclic(11) === 6` and `[5, 10).clipCyclic(4) === 9`.
     */
    clipCyclic(value: number) {
        if (this.isEmpty) {
            throw new Error(`Invalid clipping range: ${this.toString()}`);
        }
        if (value < this.start) {
            return this.endExclusive - ((this.start - value) % this.length);
        }
        if (value >= this.endExclusive) {
            return this.start + ((value - this.start) % this.length);
        }
        return value;
    }

    map<T>(f: (offset: number) => T) {
        const result: T[] = [];
        for (let i = this.start; i < this.endExclusive; i++) {
            result.push(f(i));
        }
        return result;
    }

    forEach(f: (offset: number) => void) {
        for (let i = this.start; i < this.endExclusive; i++) {
            f(i);
        }
    }
}

export class OffsetRangeSet {
    readonly #sortedRanges: OffsetRange[] = [];

    addRange(range: OffsetRange) {
        let i = 0;
        while (i < this.#sortedRanges.length && this.#sortedRanges[i].endExclusive < range.start) {
            i++;
        }
        let j = i;
        while (j < this.#sortedRanges.length && this.#sortedRanges[j].start <= range.endExclusive) {
            j++;
        }
        if (i === j) {
            this.#sortedRanges.splice(i, 0, range);
        } else {
            const start = Math.min(range.start, this.#sortedRanges[i].start);
            const end = Math.max(range.endExclusive, this.#sortedRanges[j - 1].endExclusive);
            this.#sortedRanges.splice(i, j - i, new OffsetRange(start, end));
        }
    }

    toString() {
        return this.#sortedRanges.map((r) => r.toString()).join(', ');
    }

    /**
     * Returns of there is a value that is contained in this instance and the given range.
     */
    intersectsStrict(other: OffsetRange) {
        // Known limitation: linear scan; switch to binary search if range sets grow large.
        let i = 0;
        while (i < this.#sortedRanges.length && this.#sortedRanges[i].endExclusive <= other.start) {
            i++;
        }
        return i < this.#sortedRanges.length && this.#sortedRanges[i].start < other.endExclusive;
    }

    intersectWithRange(other: OffsetRange) {
        // Known limitation: linear scan; switch to binary search + slice if range sets grow large.
        const result = new OffsetRangeSet();
        for (const range of this.#sortedRanges) {
            const intersection = range.intersect(other);
            if (intersection) {
                result.addRange(intersection);
            }
        }
        return result;
    }

    intersectWithRangeLength(other: OffsetRange) {
        return this.intersectWithRange(other).length;
    }

    get length() {
        return this.#sortedRanges.reduce((prev, cur) => prev + cur.length, 0);
    }
}
