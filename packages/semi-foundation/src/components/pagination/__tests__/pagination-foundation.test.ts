import { describe, expect, it } from 'vite-plus/test';
import PaginationFoundation from '../foundation';

const { getInitialState, getDisabled, getPageList, getPageSizeOpts } = PaginationFoundation;

describe('PaginationFoundation.getInitialState', () => {
    it('优先使用 currentPage 与 pageSize 属性，其次使用默认值', () => {
        expect(getInitialState({ currentPage: 3, defaultCurrentPage: 2, pageSize: 30, pageSizeOpts: [10] })).toEqual({
            currentPage: 3,
            pageSize: 30,
            quickJumpPage: '',
        });
        expect(getInitialState({ defaultCurrentPage: 2, pageSize: null, pageSizeOpts: [20] })).toMatchObject({
            currentPage: 2,
            pageSize: 20,
        });
        expect(getInitialState({ defaultCurrentPage: 1, pageSizeOpts: [] }).pageSize).toBe(10);
    });
});

describe('PaginationFoundation.getDisabled', () => {
    it('第一页禁用上一页，最后一页禁用下一页', () => {
        expect(getDisabled(1, 100, 10)).toEqual({ prevDisabled: true, nextDisabled: false });
        expect(getDisabled(1, 5, 10)).toEqual({ prevDisabled: true, nextDisabled: true });
        expect(getDisabled(10, 100, 10)).toEqual({ prevDisabled: false, nextDisabled: true });
        expect(getDisabled(5, 100, 10)).toEqual({ prevDisabled: false, nextDisabled: false });
    });
});

describe('PaginationFoundation.getPageList', () => {
    const pagesOf = ({ start, count }: { start: number; count: number }) => Array.from({ length: count }, (_, i) => start + i);

    it('列出每个省略号后隐藏的页码', () => {
        const first = getPageList(2, 200, 10);
        expect(first.pageList).toEqual([1, 2, 3, 4, '...', 19, 20]);
        expect(pagesOf(first.restLeftRange)).toEqual([]);
        expect(pagesOf(first.restRightRange)).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);

        const middle = getPageList(10, 200, 10);
        expect(middle.pageList).toEqual([1, '...', 9, 10, 11, '...', 20]);
        expect(pagesOf(middle.restLeftRange)).toEqual([2, 3, 4, 5, 6, 7, 8]);
        expect(pagesOf(middle.restRightRange)).toEqual([12, 13, 14, 15, 16, 17, 18, 19]);

        const last = getPageList(18, 200, 10);
        expect(last.pageList).toEqual([1, '...', 16, 17, 18, 19, 20]);
        expect(pagesOf(last.restLeftRange)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
        expect(pagesOf(last.restRightRange)).toEqual([]);

        const fourth = getPageList(4, 200, 10);
        expect(fourth.pageList).toEqual([1, 2, 3, 4, 5, '...', 20]);
        expect(pagesOf(fourth.restRightRange)).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    });

    it('页数很多时只给出区间，不构建页码数组', () => {
        const { restLeftRange, restRightRange } = getPageList(2000000, 50000000, 10);
        expect(restLeftRange).toEqual({ start: 2, count: 1999997 });
        expect(restRightRange).toEqual({ start: 2000002, count: 2999998 });
    });

    it('当前页超过最后一页时返回空页码', () => {
        expect(getPageList(21, 200, 10).pageList).toEqual([]);
        expect(getPageList(9, 50, 10).pageList).toEqual([1, 2, 3, 4, 5]);
    });
});

describe('PaginationFoundation.getPageSizeOpts', () => {
    it('按顺序插入缺失的 pageSize，且不改变选项', () => {
        const opts = [10, 20, 40];
        expect(getPageSizeOpts(opts, 20)).toEqual([10, 20, 40]);
        expect(getPageSizeOpts(opts, 5)).toEqual([5, 10, 20, 40]);
        expect(getPageSizeOpts(opts, 30)).toEqual([10, 20, 30, 40]);
        expect(getPageSizeOpts(opts, 50)).toEqual([10, 20, 40, 50]);
        expect(opts).toEqual([10, 20, 40]);
    });
});
