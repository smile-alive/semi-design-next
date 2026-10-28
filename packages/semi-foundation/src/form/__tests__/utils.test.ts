import { describe, expect, it, vi } from 'vite-plus/test';
import { generateKeys, isValid } from '../utils';

// foundation must not import react, so a React 19 element is spelled out by its shape
const element = { $$typeof: Symbol.for('react.transitional.element'), type: 'span', props: {} };

describe('form 工具 isValid', () => {
    it.each([
        [undefined, true],
        [null, true],
        ['', true],
        ['required', false],
        [[], true],
        [['', undefined], true],
        [['', 'required'], false],
        [true, true],
        [false, false],
        [{}, false],
        [element, false],
        [[element], false],
        // JSX compiled to an accessor is a function that returns the node
        [() => element, false],
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
        warn.mockRestore();
    });
});
