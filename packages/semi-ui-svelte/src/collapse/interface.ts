import type { Snippet } from 'svelte';
import type { HTMLAttributes } from 'svelte/elements';

export interface CollapseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    /** `null` and `''` are controlled "nothing open" values. */
    activeKey?: string | string[] | null;
    accordion?: boolean;
    clickHeaderToExpand?: boolean;
    expandIconPosition?: 'left' | 'right';
    keepDOM?: boolean;
    motion?: boolean;
    lazyRender?: boolean;
    /** A keyboard toggle is also a click, because the header is a native button. */
    onChange?: (activeKey: string[], event: MouseEvent) => void;
    expandIcon?: Snippet;
    collapseIcon?: Snippet;
    children?: Snippet;
}

export interface CollapsePanelProps extends HTMLAttributes<HTMLDivElement> {
    itemKey: string;
    showArrow?: boolean;
    disabled?: boolean;
    onMotionEnd?: () => void;
    /** Inside the toggle button, so only phrasing content. */
    header?: Snippet;
    /** Outside the toggle button, so it may hold its own controls. */
    extra?: Snippet;
    children?: Snippet;
}
