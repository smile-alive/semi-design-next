import { describe, expect, it } from 'vite-plus/test';
import BreadcrumbFoundation from '../foundation';

describe('BreadcrumbFoundation.getCollapseRange', () => {
    it.each([
        { total: 3, max: 4, active: undefined, range: [1, -1], desc: '项数不超过 maxItemCount 时不折叠' },
        { total: 4, max: 4, active: undefined, range: [1, 0], desc: '项数等于 maxItemCount 时不折叠' },
        { total: 6, max: 1, active: undefined, range: [1, 4], desc: 'maxItemCount 小于 2 时仍保留首尾项' },
        { total: 10, max: 4, active: undefined, range: [1, 6], desc: '无 activeIndex 时折叠第 1 项之后的前 n - max 项' },
        { total: 6, max: 4, active: 0, range: [1, 2], desc: 'activeIndex 在首项时不影响折叠区间' },
        { total: 6, max: 4, active: 5, range: [1, 2], desc: 'activeIndex 在末项时不影响折叠区间' },
        { total: 6, max: 4, active: 4, range: [1, 2], desc: 'activeIndex 在默认区间之后时不影响折叠区间' },
        { total: 10, max: 4, active: 6, range: [1, 5], desc: '前段更长时折叠 activeIndex 之前' },
        { total: 7, max: 2, active: 3, range: [1, 2], desc: '两段等长时折叠前段' },
        { total: 6, max: 2, active: 4, range: [1, 3], desc: 'activeIndex 紧邻末项时折叠其前所有项' },
        { total: 6, max: 4, active: 1, range: [2, 3], desc: '后段更长时折叠 activeIndex 之后' },
        { total: 3, max: 2, active: 1, range: [1, 0], desc: '保护 activeIndex 后区间为空则不折叠' },
    ])('$desc', ({ total, max, active, range: [start, end] }) => {
        expect(BreadcrumbFoundation.getCollapseRange(total, max, active)).toEqual({ start, end });
    });
});

describe('BreadcrumbFoundation.isActive', () => {
    it('有 activeIndex 时只认该项，否则认末项', () => {
        expect(BreadcrumbFoundation.isActive(1, 3, 1)).toBe(true);
        expect(BreadcrumbFoundation.isActive(2, 3, 1)).toBe(false);
        expect(BreadcrumbFoundation.isActive(2, 3)).toBe(true);
        expect(BreadcrumbFoundation.isActive(0, 3)).toBe(false);
    });
});

describe('BreadcrumbFoundation.shouldRenderSeparator', () => {
    const collapse = { collapsed: true, start: 1, end: 2, hasCustomMore: false, moreType: 'popover' };

    it('末项之后没有分隔符', () => {
        expect(BreadcrumbFoundation.shouldRenderSeparator(3, 4, { ...collapse, collapsed: false })).toBe(false);
        expect(BreadcrumbFoundation.shouldRenderSeparator(0, 4, { ...collapse, collapsed: false })).toBe(true);
    });

    it('折叠区间内的项在 popover 或自定义 more 下不渲染分隔符', () => {
        expect(BreadcrumbFoundation.shouldRenderSeparator(1, 4, collapse)).toBe(false);
        expect(BreadcrumbFoundation.shouldRenderSeparator(1, 4, { ...collapse, moreType: 'default', hasCustomMore: true })).toBe(false);
        expect(BreadcrumbFoundation.shouldRenderSeparator(0, 4, collapse)).toBe(true);
    });

    it('默认 more 或未折叠时区间内的项保留分隔符', () => {
        expect(BreadcrumbFoundation.shouldRenderSeparator(1, 4, { ...collapse, moreType: 'default' })).toBe(true);
        expect(BreadcrumbFoundation.shouldRenderSeparator(1, 4, { ...collapse, collapsed: false })).toBe(true);
    });
});

describe('BreadcrumbFoundation.genRoutes', () => {
    it('把字符串路由包装为对象，对象路由保留为 _origin', () => {
        const home = { path: '/', name: 'home', key: 'h' };
        const [first, second] = BreadcrumbFoundation.genRoutes([home, 'list']);
        expect(first).toEqual({ ...home, _origin: home });
        expect(first._origin).toBe(home);
        expect(second).toEqual({ name: 'list', _origin: { name: 'list' } });
    });
});
