import { describe, expect, it } from 'vite-plus/test';
import shallowEqualObjects from '../shallow-equal-objects';

describe('shallowEqualObjects', () => {
    it('同一引用或键值逐个相同返回 true', () => {
        const a = { x: 1 };
        expect(shallowEqualObjects(a, a)).toBe(true);
        expect(shallowEqualObjects({ x: 1, y: 'a' }, { x: 1, y: 'a' })).toBe(true);
    });

    it('值不同、键数不同、缺失键返回 false', () => {
        expect(shallowEqualObjects({ x: 1 }, { x: 2 })).toBe(false);
        expect(shallowEqualObjects({ x: 1 }, { x: 1, y: 2 })).toBe(false);
        expect(shallowEqualObjects({ x: undefined }, { y: undefined })).toBe(false);
    });

    it('任一为空返回 false', () => {
        expect(shallowEqualObjects(null, { x: 1 })).toBe(false);
        expect(shallowEqualObjects({ x: 1 }, undefined)).toBe(false);
    });

    it('NaN 视为相同，+0 与 -0 视为不同', () => {
        expect(shallowEqualObjects({ x: NaN }, { x: NaN })).toBe(true);
        expect(shallowEqualObjects({ x: 0 }, { x: -0 })).toBe(false);
    });
});
