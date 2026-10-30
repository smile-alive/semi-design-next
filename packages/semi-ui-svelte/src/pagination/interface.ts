import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';
import type { Position } from '../tooltip/index.js';

export interface PaginationProps extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
    total?: number;
    showTotal?: boolean;
    /** Bindable; the size changer writes the chosen size back. Leave it out for an uncontrolled size */
    pageSize?: number;
    pageSizeOpts?: number[];
    size?: 'small' | 'default';
    /** Bindable; leave it out for an uncontrolled page. `bind:currentPage={get, set}` makes it fully controlled */
    currentPage?: number;
    /** Not rendered when `size` is `small` */
    showSizeChanger?: boolean;
    showQuickJumper?: boolean;
    /** Position of the omitted pages popover and the size changer dropdown; not used by the `small` size */
    popoverPosition?: Position;
    hideOnSinglePage?: boolean;
    /** Only for `size="small"`: the page select opens on hover or focus */
    hoverShowPageSelect?: boolean;
    disabled?: boolean;
    /** Keeps the current page when the page size changes; the consumer picks the page from `onPageSizeChange` */
    preventPageChangeOnPageSizeChange?: boolean;
    onPageChange?: (currentPage: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    onChange?: (currentPage: number, pageSize: number) => void;
    /** Replaces the previous icon; a string or a lone text snippet names the button, any other content leaves the locale name */
    prevText?: string | Snippet;
    nextText?: string | Snippet;
}
