import { describe, expect, it } from 'vite-plus/test';
import { gutterStyle, normalizeGutter, resolveGutterByBreakpoint } from '../gutter';

describe('normalizeGutter', () => {
    it('数组拆成横纵两个轴，单值只作用于横向', () => {
        expect(normalizeGutter([16, { md: 8 }])).toEqual([16, { md: 8 }]);
        expect(normalizeGutter(16)).toEqual([16, undefined]);
        expect(normalizeGutter(undefined)).toEqual([undefined, undefined]);
    });
});

describe('gutterStyle', () => {
    it('每个断点都写出变量，未定义的断点也是 0px', () => {
        expect(gutterStyle('x', { md: 16 })).toEqual({
            '--semi-row-gutter-x-xs': '0px',
            '--semi-row-gutter-x-sm': '0px',
            '--semi-row-gutter-x-md': '16px',
            '--semi-row-gutter-x-lg': '16px',
            '--semi-row-gutter-x-xl': '16px',
            '--semi-row-gutter-x-xxl': '16px',
        });
        expect(Object.keys(gutterStyle('y', undefined))).toHaveLength(6);
        expect(Object.values(gutterStyle('y', undefined))).toEqual(Array(6).fill('0px'));
    });
});

describe('resolveGutterByBreakpoint', () => {
    it('数字 gutter 对每个断点都返回同一个值', () => {
        expect(resolveGutterByBreakpoint(16)).toEqual({ xs: 16, sm: 16, md: 16, lg: 16, xl: 16, xxl: 16 });
    });

    it('未传 gutter 时每个断点都是 0', () => {
        expect(resolveGutterByBreakpoint(undefined)).toEqual({ xs: 0, sm: 0, md: 0, lg: 0, xl: 0, xxl: 0 });
    });

    it('负数 gutter 按 0 处理，而不是产生向内的正间距', () => {
        expect(resolveGutterByBreakpoint(-8)).toEqual({ xs: 0, sm: 0, md: 0, lg: 0, xl: 0, xxl: 0 });
    });

    it('对象 gutter 中，sm 及以上的断点形成移动优先的层叠：未定义的断点延用更小断点已生效的值', () => {
        expect(resolveGutterByBreakpoint({ md: 16, xl: 24 })).toEqual({
            xs: 0,
            sm: 0,
            md: 16,
            lg: 16,
            xl: 24,
            xxl: 24,
        });
    });

    it('xs 是独立区间：不向 sm 及以上断点传递，也不从它们继承', () => {
        expect(resolveGutterByBreakpoint({ xs: 4, md: 16 })).toEqual({
            xs: 4,
            sm: 0,
            md: 16,
            lg: 16,
            xl: 16,
            xxl: 16,
        });
    });

    it('只定义 sm 时，md 及以上延用 sm 的值，xs 为 0', () => {
        expect(resolveGutterByBreakpoint({ sm: 8 })).toEqual({ xs: 0, sm: 8, md: 8, lg: 8, xl: 8, xxl: 8 });
    });

    it('对象断点值为负数时按 0 处理', () => {
        expect(resolveGutterByBreakpoint({ md: -8 })).toEqual({ xs: 0, sm: 0, md: 0, lg: 0, xl: 0, xxl: 0 });
    });

    it('空对象时所有断点都是 0', () => {
        expect(resolveGutterByBreakpoint({})).toEqual({ xs: 0, sm: 0, md: 0, lg: 0, xl: 0, xxl: 0 });
    });

    it('较大断点定义为 0 会覆盖较小断点非 0 的值（与 Col 的 order/offset 断点重置语义一致）', () => {
        expect(resolveGutterByBreakpoint({ sm: 16, lg: 0 })).toEqual({ xs: 0, sm: 16, md: 16, lg: 0, xl: 0, xxl: 0 });
    });
});
