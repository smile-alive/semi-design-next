import { describe, expect, it } from 'vite-plus/test';
import { centerInScroller, resolvePopupContainer, toCssLength } from '../dom';

describe('resolvePopupContainer', () => {
    it('有函数时用函数的结果，没有时用 fallback，fallback 默认为 body', () => {
        const own = document.createElement('div');
        const fallback = document.createElement('section');
        expect(resolvePopupContainer(() => own, fallback)).toBe(own);
        expect(resolvePopupContainer(undefined, fallback)).toBe(fallback);
        expect(resolvePopupContainer()).toBe(document.body);
    });

    it('选中的函数返回 null 时报错，不回落到 fallback', () => {
        expect(() => resolvePopupContainer(() => null, document.body)).toThrow(/getPopupContainer returned no element/);
    });
});

describe('centerInScroller', () => {
    it('把节点滚到滚动容器的中央', () => {
        const scroller = document.createElement('div');
        const node = document.createElement('div');
        Object.defineProperties(scroller, { offsetTop: { value: 10 }, clientHeight: { value: 100 } });
        Object.defineProperties(node, { offsetTop: { value: 310 }, clientHeight: { value: 20 } });
        centerInScroller(node, scroller);
        expect(scroller.scrollTop).toBe(310 - 10 - 50 + 10);
    });
});

describe('toCssLength', () => {
    it.each<[number | string | null | undefined, string | undefined]>([
        [0, '0px'],
        [12.5, '12.5px'],
        ['10%', '10%'],
        ['', ''],
        [undefined, undefined],
        [null, undefined],
    ])('%s -> %s', (value, expected) => {
        expect(toCssLength(value)).toBe(expected);
    });
});
