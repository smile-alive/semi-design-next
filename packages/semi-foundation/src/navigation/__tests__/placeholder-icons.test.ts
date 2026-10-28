import { describe, expect, it } from 'vite-plus/test';
import { countPlaceholderIcons } from '../item-foundation';

const base = { mode: 'vertical', limitIndent: false, isCollapsed: false, hasIcon: false, indent: false, level: 2 };

describe('countPlaceholderIcons', () => {
    it('非 vertical、limitIndent、收起时为 0', () => {
        expect(countPlaceholderIcons({ ...base, mode: 'horizontal' })).toBe(0);
        expect(countPlaceholderIcons({ ...base, limitIndent: true })).toBe(0);
        expect(countPlaceholderIcons({ ...base, isCollapsed: true })).toBe(0);
    });

    it('有图标且不缩进时每层一个，否则少一个', () => {
        expect(countPlaceholderIcons({ ...base, hasIcon: true })).toBe(2);
        expect(countPlaceholderIcons({ ...base, hasIcon: true, indent: true })).toBe(1);
        expect(countPlaceholderIcons(base)).toBe(1);
    });

    it('不会为负数', () => {
        expect(countPlaceholderIcons({ ...base, level: 0 })).toBe(0);
    });
});
