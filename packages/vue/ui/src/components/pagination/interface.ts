import type { VNode } from 'vue';
import type { Position } from '../tooltip/interface';

export interface PaginationProps {
    total?: number;
    showTotal?: boolean;
    /**
     * Not strictly controlled: the size changer's choice is kept inside, and only a change of this prop to a value
     * other than the current one overrides it and goes back to page 1
     */
    pageSize?: number;
    pageSizeOpts?: number[];
    size?: 'small' | 'default';
    /** Controlled page; `undefined` leaves the page to the component */
    currentPage?: number;
    defaultCurrentPage?: number;
    /** Not rendered when `size` is `small` */
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    /** Position of the omitted pages popover and the size changer dropdown; not used by the `small` size */
    popoverPosition?: Position;
    hideOnSinglePage?: boolean;
    /** Only for `size="small"`: the page select opens on hover or focus */
    hoverShowPageSelect?: boolean;
    disabled?: boolean;
    /** Keeps the current page when the page size changes; the consumer picks the page from `pageSizeChange` */
    preventPageChangeOnPageSizeChange?: boolean;
}

export interface PaginationEmits {
    'update:currentPage': [currentPage: number];
    'update:pageSize': [pageSize: number];
    pageChange: [currentPage: number];
    pageSizeChange: [pageSize: number];
    change: [currentPage: number, pageSize: number];
}

export interface PaginationSlots {
    /** Replaces the previous icon; a text names the button, any other content leaves the locale name */
    prevText?: () => VNode[];
    nextText?: () => VNode[];
}
