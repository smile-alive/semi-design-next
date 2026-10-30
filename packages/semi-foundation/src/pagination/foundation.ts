import BaseFoundation, { type DefaultAdapter } from '../base/foundation';
import { numbers } from './constants';

export interface PaginationAdapter<P extends PaginationBaseProps = PaginationBaseProps, S extends PaginationBaseState = PaginationBaseState> extends DefaultAdapter<P, S> {
    updatePageSize: (pageSize: number) => void;
    updateQuickJumpPage: (quickJumpPage: string | number) => void;
    setCurrentPage: (pageIndex: number) => void;
    notifyPageChange: (pageIndex: number) => void;
    notifyPageSizeChange: (pageSize: number) => void;
    notifyChange: (pageIndex: number, pageSize: number) => void;
}

export type PageRenderText = number | '...';
export type PageList = PageRenderText[];

/** `count` consecutive pages from `start`; the pages hidden behind an ellipsis can number in the millions */
export interface PageRange {
    start: number;
    count: number;
}

export interface AdapterPageList {
    pageList: PageRenderText[];
    restLeftRange: PageRange;
    restRightRange: PageRange;
}

/** The props the foundation reads */
export interface PaginationBaseProps {
    currentPage?: number;
    preventPageChangeOnPageSizeChange?: boolean;
    total?: number;
}

/** The state the foundation reads */
export interface PaginationBaseState {
    currentPage: number;
    pageSize: number;
    quickJumpPage: string | number;
}

export default class PaginationFoundation<P extends PaginationBaseProps = PaginationBaseProps, S extends PaginationBaseState = PaginationBaseState> extends BaseFoundation<PaginationAdapter<P, S>, P, S> {
    #handleQuickJump(quickJumpPage: string | number) {
        // Number('') is 0
        if (quickJumpPage === '') {
            return;
        }
        let page = Number(quickJumpPage);
        const totalPageNum = PaginationFoundation.getTotalPageNumber(this.getProp('total'), this.getState('pageSize'));
        if (Number.isNaN(page)) {
            return;
        }
        // InputNumber has no precision here, so a fractional page can arrive
        page = Math.trunc(page);
        if (page > totalPageNum) {
            page = totalPageNum;
        }
        if (page <= 0) {
            page = 1;
        }
        this._adapter.updateQuickJumpPage('');
        this.goPage(page);
    }

    static getInitialState(props: { currentPage?: number; defaultCurrentPage?: number; pageSize?: number; pageSizeOpts?: readonly number[] }) {
        return {
            currentPage: props.currentPage || props.defaultCurrentPage,
            pageSize: props.pageSize || props.pageSizeOpts[0] || numbers.DEFAULT_PAGE_SIZE,
            quickJumpPage: '' as string | number,
        };
    }

    static getTotalPageNumber(total: number, pageSize: number) {
        return Math.ceil(total / pageSize);
    }

    static getDisabled(currentPage: number, total: number, pageSize: number) {
        const totalPageNum = PaginationFoundation.getTotalPageNumber(total, pageSize);
        if (currentPage === 1) {
            return { prevDisabled: true, nextDisabled: totalPageNum < 2 };
        }
        return { prevDisabled: false, nextDisabled: currentPage === totalPageNum };
    }

    static getPageList(currentPage: number, total: number, pageSize: number): AdapterPageList {
        /**
         * Truncation (t total pages, c current page), always 7 slots once t>7:
         * c<4: ellipsis at 4th; c=4: at 6th; 4<c<t-3: at 2nd and 6th; t-3<=c<=t: at 2nd, then the last 5 pages.
         * A current page past the last one matches none of these and gets an empty list.
         */
        const totalPageNum = PaginationFoundation.getTotalPageNumber(total, pageSize);
        const { PAGE_SHOW_MAX } = numbers;
        const noPages: PageRange = { start: 1, count: 0 };
        if (totalPageNum <= PAGE_SHOW_MAX) {
            return {
                pageList: Array.from({ length: totalPageNum }, (_v, i) => i + 1),
                restLeftRange: noPages,
                restRightRange: noPages,
            };
        }
        if (currentPage < 4) {
            return {
                pageList: [1, 2, 3, 4, '...', totalPageNum - 1, totalPageNum],
                restLeftRange: noPages,
                restRightRange: { start: 5, count: totalPageNum - 6 },
            };
        }
        if (currentPage === 4) {
            return {
                pageList: [1, 2, 3, 4, 5, '...', totalPageNum],
                restLeftRange: noPages,
                restRightRange: { start: 6, count: totalPageNum - 6 },
            };
        }
        if (currentPage < totalPageNum - 3) {
            const middle = Array.from({ length: 3 }, (_v, i) => currentPage + (i - 1));
            return {
                pageList: [1, '...', ...middle, '...', totalPageNum],
                restLeftRange: { start: 2, count: currentPage - 3 },
                restRightRange: { start: currentPage + 2, count: totalPageNum - currentPage - 2 },
            };
        }
        if (currentPage <= totalPageNum) {
            const right = Array.from({ length: 5 }, (_v, i) => totalPageNum - (4 - i));
            return {
                pageList: [1, '...', ...right],
                restLeftRange: { start: 2, count: right[0] - 2 },
                restRightRange: noPages,
            };
        }
        return { pageList: [], restLeftRange: noPages, restRightRange: noPages };
    }

    static getPageSizeOpts(pageSizeOpts: readonly number[], pageSize: number) {
        if (pageSizeOpts.includes(pageSize)) {
            return [...pageSizeOpts];
        }
        const firstLargerIndex = pageSizeOpts.findIndex((el) => el > pageSize);
        return firstLargerIndex === -1 ? [...pageSizeOpts, pageSize] : pageSizeOpts.toSpliced(firstLargerIndex, 0, pageSize);
    }

    goPage = (targetPageIndex: number | '...') => {
        if (targetPageIndex === '...') {
            return;
        }
        const { pageSize, currentPage } = this.getStates();
        if (targetPageIndex === currentPage) {
            return;
        }
        if (!this._isControlledComponent('currentPage')) {
            this.updatePage(targetPageIndex);
        }
        this._adapter.notifyPageChange(targetPageIndex);
        this._adapter.notifyChange(targetPageIndex, pageSize);
    };

    // undefined means page 1: an uncontrolled pager restarts when its total or pageSize prop changes
    updatePage = (targetPageIndex = 1, pageSize?: number) => {
        const { currentPage, pageSize: currentPageSize } = this.getStates();
        const newPageSize = pageSize ?? currentPageSize;
        if (targetPageIndex !== currentPage) {
            this._adapter.setCurrentPage(targetPageIndex);
        }
        if (newPageSize !== currentPageSize) {
            this._adapter.updatePageSize(newPageSize);
        }
    };

    goPrev = () => {
        const { currentPage } = this.getStates();
        if (currentPage > 1) {
            this.goPage(currentPage - 1);
        }
    };

    goNext = () => {
        const { currentPage, pageSize } = this.getStates();
        if (currentPage <= PaginationFoundation.getTotalPageNumber(this.getProp('total'), pageSize) - 1) {
            this.goPage(currentPage + 1);
        }
    };

    changePageSize = (newPageSize: number) => {
        const { pageSize, currentPage } = this.getStates();
        this._adapter.updatePageSize(newPageSize);
        this._adapter.notifyPageSizeChange(newPageSize);

        let newCurrentPage = currentPage;
        if (!this.getProp('preventPageChangeOnPageSizeChange')) {
            const currentPageFirstItemIndex = (currentPage - 1) * pageSize + 1;
            newCurrentPage = Math.ceil(currentPageFirstItemIndex / newPageSize);
        }

        if (!this._isControlledComponent('currentPage')) {
            this.updatePage(newCurrentPage, newPageSize);
        }
        if (currentPage !== newCurrentPage) {
            this._adapter.notifyPageChange(newCurrentPage);
        }
        this._adapter.notifyChange(newCurrentPage, newPageSize);
    };

    handleQuickJumpNumberChange = (targetPage: string | number) => {
        this._adapter.updateQuickJumpPage(targetPage);
    };

    handleQuickJumpBlur = () => {
        const { quickJumpPage } = this.getStates();

        if ((typeof quickJumpPage === 'string' && quickJumpPage) || typeof quickJumpPage === 'number') {
            this.#handleQuickJump(quickJumpPage);
        }
    };

    handleQuickJumpEnterPress = (targetPage: string) => {
        this.#handleQuickJump(targetPage);
    };
}
