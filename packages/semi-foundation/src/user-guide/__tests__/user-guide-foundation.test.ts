import { describe, expect, it, vi } from 'vite-plus/test';
import UserGuideFoundation from '../foundation';

describe('UserGuideFoundation 静态方法', () => {
    it('deriveCurrent 显示不为 undefined 的 current 属性，否则显示 state', () => {
        expect(UserGuideFoundation.deriveCurrent({ current: 2 }, { current: 0 })).toBe(2);
        expect(UserGuideFoundation.deriveCurrent({ current: 0 }, { current: 1 })).toBe(0);
        expect(UserGuideFoundation.deriveCurrent({ current: undefined }, { current: 1 })).toBe(1);
    });

    it('getSpotlightPadding 优先取 step，其次取组件，并保留 0', () => {
        expect(UserGuideFoundation.getSpotlightPadding({ spotlightPadding: 15 }, 10)).toBe(15);
        expect(UserGuideFoundation.getSpotlightPadding({ spotlightPadding: 0 }, 10)).toBe(0);
        expect(UserGuideFoundation.getSpotlightPadding({}, 10)).toBe(10);
        expect(UserGuideFoundation.getSpotlightPadding({}, 0)).toBe(0);
        expect(UserGuideFoundation.getSpotlightPadding(undefined, undefined)).toBe(5);
    });

    it('getTarget 取元素或调用函数，找不到时返回空值', () => {
        const el = document.createElement('div');
        expect(UserGuideFoundation.getTarget({ target: el })).toBe(el);
        expect(UserGuideFoundation.getTarget({ target: () => el })).toBe(el);
        expect(UserGuideFoundation.getTarget({ target: () => null })).toBeNull();
        expect(UserGuideFoundation.getTarget(undefined)).toBeUndefined();
    });

    it('measure 按外扩后的矩形返回，没有目标时返回 null，滚动只在需要时发生', () => {
        const el = document.createElement('div');
        el.getBoundingClientRect = () => new DOMRect(10, 20, 100, 30);
        const scrollIntoView = vi.fn<() => void>();
        el.scrollIntoView = scrollIntoView;
        const rect = UserGuideFoundation.measure({ target: el, spotlightPadding: 4 }, 10, true);
        expect([rect?.x, rect?.y, rect?.width, rect?.height]).toEqual([6, 16, 108, 38]);
        expect(scrollIntoView).not.toHaveBeenCalled();
        el.getBoundingClientRect = () => new DOMRect(10, -50, 100, 30);
        UserGuideFoundation.measure({ target: el }, undefined, false);
        expect(scrollIntoView).not.toHaveBeenCalled();
        UserGuideFoundation.measure({ target: el }, undefined, true);
        expect(scrollIntoView).toHaveBeenCalledTimes(1);
        expect(UserGuideFoundation.measure({ target: () => null }, 5, true)).toBeNull();
    });

    it('isSameRect 逐项比较，空值只与空值相同', () => {
        expect(UserGuideFoundation.isSameRect(new DOMRect(1, 2, 3, 4), new DOMRect(1, 2, 3, 4))).toBe(true);
        expect(UserGuideFoundation.isSameRect(new DOMRect(1, 2, 3, 4), new DOMRect(1, 2, 3, 5))).toBe(false);
        expect(UserGuideFoundation.isSameRect(null, null)).toBe(true);
        expect(UserGuideFoundation.isSameRect(null, new DOMRect())).toBe(false);
    });
});
