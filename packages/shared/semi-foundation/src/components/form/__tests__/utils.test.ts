import { describe, expect, it, vi } from 'vite-plus/test';
import { generateKeys, isValid } from '../utils';

describe('form 工具 isValid', () => {
    it.each([
        [undefined, true],
        [null, true],
        [[], true],
        [{}, true],
        [{ a: undefined, b: [undefined] }, true],
        [['required'], false],
        [[''], false],
        [{ a: ['required'] }, false],
        [{ rows: [undefined, { q: ['required'] }] }, false],
        [[['required']], false],
    ])('isValid(%o) 结果为 %s', (errors, expected) => {
        expect(isValid(errors)).toBe(expected);
    });
});

describe('form 工具 generateKeys', () => {
    it('每行生成一个互不相同的 key', () => {
        const keys = generateKeys([1, 2, 3]);
        expect(keys).toHaveLength(3);
        expect(new Set(keys).size).toBe(3);
    });

    it('沿用已有 key，新增的行补新 key', () => {
        const keys = generateKeys([1, 2, 3], ['a', 'b']);
        expect(keys.slice(0, 2)).toEqual(['a', 'b']);
        expect(keys[2]).toBeTruthy();
    });

    it('行数减少时丢弃多余的 key', () => {
        expect(generateKeys([1], ['a', 'b'])).toEqual(['a']);
    });

    it('非数组时返回空数组并给出一次警告，undefined 不警告', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        expect(generateKeys(undefined)).toEqual([]);
        expect(warn).not.toHaveBeenCalled();
        expect(generateKeys('x')).toEqual([]);
        expect(warn).toHaveBeenCalledTimes(1);
    });
});
