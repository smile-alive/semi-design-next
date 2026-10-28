import { describe, expect, it } from 'vitest';
import { getPopoverRole, getPopoverSpacing, numbers } from '../constants';

describe('getPopoverRole', () => {
    it('explicit role wins', () => {
        expect(getPopoverRole('menu', 'hover')).toBe('menu');
    });

    it('interactive triggers are dialogs', () => {
        for (const trigger of ['click', 'custom', 'contextMenu']) {
            expect(getPopoverRole(undefined, trigger)).toBe('dialog');
        }
    });

    it('hover and focus triggers are tooltips', () => {
        for (const trigger of ['hover', 'focus']) {
            expect(getPopoverRole(undefined, trigger)).toBe('tooltip');
        }
    });
});

describe('getPopoverSpacing', () => {
    it('explicit spacing is returned as is', () => {
        expect(getPopoverSpacing(0, true)).toBe(0);
        expect(getPopoverSpacing({ x: 1, y: 2 }, true)).toEqual({ x: 1, y: 2 });
    });

    it('defaults depend on the arrow', () => {
        expect(getPopoverSpacing(undefined, true)).toBe(numbers.SPACING_WITH_ARROW);
        expect(getPopoverSpacing(undefined, false)).toBe(numbers.SPACING);
        expect(getPopoverSpacing(undefined)).toBe(numbers.SPACING);
    });
});
