import { describe, expect, it } from 'vite-plus/test';
import { differenceUnique } from '../array';

describe('differenceUnique', () => {
    it.each([
        { source: ['a', 'b', 'c', 'a', 'b', 'c'], removed: ['a', 'c'], expected: ['b'] },
        { source: ['a', 'a'], removed: [], expected: ['a'] },
        { source: [], removed: ['a'], expected: [] },
        { source: [1, 2, 2, 3], removed: [4], expected: [1, 2, 3] },
    ])('$source 去掉 $removed 得到去重后的 $expected', ({ source, removed, expected }) => {
        const result = differenceUnique<string | number>(source, removed);
        expect(result).toEqual(expected);
        expect(result).not.toBe(source);
    });
});
