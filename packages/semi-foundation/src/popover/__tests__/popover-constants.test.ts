import { describe, expect, it } from 'vite-plus/test';
import { getPopoverRole, getPopoverSpacing, numbers } from '../constants';

describe('getPopoverRole', () => {
    it('显式传入的 role 优先', () => {
        expect(getPopoverRole('menu', 'hover')).toBe('menu');
    });

    it('click、custom、contextMenu 触发的弹层是 dialog', () => {
        for (const trigger of ['click', 'custom', 'contextMenu']) {
            expect(getPopoverRole(undefined, trigger)).toBe('dialog');
        }
    });

    it('hover、focus 触发的弹层是 tooltip', () => {
        for (const trigger of ['hover', 'focus']) {
            expect(getPopoverRole(undefined, trigger)).toBe('tooltip');
        }
    });
});

describe('getPopoverSpacing', () => {
    it('显式传入的间距原样返回', () => {
        expect(getPopoverSpacing(0, true)).toBe(0);
        expect(getPopoverSpacing({ x: 1, y: 2 }, true)).toEqual({ x: 1, y: 2 });
    });

    it('未传间距时默认值取决于是否有箭头', () => {
        expect(getPopoverSpacing(undefined, true)).toBe(numbers.SPACING_WITH_ARROW);
        expect(getPopoverSpacing(undefined, false)).toBe(numbers.SPACING);
        expect(getPopoverSpacing(undefined)).toBe(numbers.SPACING);
    });
});
