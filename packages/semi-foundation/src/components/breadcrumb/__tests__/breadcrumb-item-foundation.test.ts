import { describe, expect, it, vi } from 'vite-plus/test';
import BreadcrumbItemFoundation from '../item-foundation';

describe('BreadcrumbItemFoundation.getTooltipConfig', () => {
    it('关闭 tooltip 时只保留宽度和省略位置', () => {
        expect(BreadcrumbItemFoundation.getTooltipConfig(false)).toEqual({ width: 150, ellipsisPos: 'end' });
        expect(BreadcrumbItemFoundation.getTooltipConfig(undefined)).toEqual({ width: 150, ellipsisPos: 'end' });
    });

    it('true 使用默认 tooltip 配置', () => {
        expect(BreadcrumbItemFoundation.getTooltipConfig(true)).toEqual({ width: 150, ellipsisPos: 'end', opts: { autoAdjustOverflow: true, position: 'top' } });
    });

    it('对象与默认值深合并，且每次返回新对象', () => {
        const custom = { width: 80, opts: { position: 'bottom' } };
        const merged = BreadcrumbItemFoundation.getTooltipConfig(custom);
        expect(merged).toEqual({ width: 80, ellipsisPos: 'end', opts: { autoAdjustOverflow: true, position: 'bottom' } });
        expect(custom).toEqual({ width: 80, opts: { position: 'bottom' } });
        expect(BreadcrumbItemFoundation.getTooltipConfig(false)).not.toBe(BreadcrumbItemFoundation.getTooltipConfig(false));
    });
});

describe('BreadcrumbItemFoundation.isKeyboardLink', () => {
    const base = { active: false, hasHref: false, noLink: false, hasOnClick: true };

    it('只有无 href、非当前项、可点击且不是 noLink 的项才是键盘链接', () => {
        expect(BreadcrumbItemFoundation.isKeyboardLink(base)).toBe(true);
        expect(BreadcrumbItemFoundation.isKeyboardLink({ ...base, active: true })).toBe(false);
        expect(BreadcrumbItemFoundation.isKeyboardLink({ ...base, hasHref: true })).toBe(false);
        expect(BreadcrumbItemFoundation.isKeyboardLink({ ...base, noLink: true })).toBe(false);
        expect(BreadcrumbItemFoundation.isKeyboardLink({ ...base, hasOnClick: false })).toBe(false);
    });
});

describe('BreadcrumbItemFoundation#handleKeyDown', () => {
    // handleKeyDown does not touch the adapter
    const foundation = new BreadcrumbItemFoundation({} as never);
    const createEvent = (key: string) => ({ key, preventDefault: vi.fn<() => void>(), currentTarget: { click: vi.fn<() => void>() } });

    it('键盘链接上的 Enter 转成一次真实 click', () => {
        const event = createEvent('Enter');
        foundation.handleKeyDown(event, true);
        expect(event.preventDefault).toHaveBeenCalled();
        expect(event.currentTarget.click).toHaveBeenCalled();
    });

    it('非键盘链接或其他按键不处理', () => {
        const event = createEvent('Enter');
        foundation.handleKeyDown(event, false);
        foundation.handleKeyDown({ ...event, key: 'a' }, true);
        expect(event.preventDefault).not.toHaveBeenCalled();
        expect(event.currentTarget.click).not.toHaveBeenCalled();
    });
});
