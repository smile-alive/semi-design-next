import type { Snippet } from 'svelte';
import type { ClassValue, HTMLAttributes } from 'svelte/elements';
import type { CollapsePanelPart, CollapsePart } from '@fibrae/semi-foundation/components/collapse/constants';

export interface CollapseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    classNames?: Partial<Record<CollapsePart, ClassValue>>;
    styles?: Partial<Record<CollapsePart, string>>;
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
    classNames?: Partial<Record<CollapsePanelPart, ClassValue>>;
    styles?: Partial<Record<CollapsePanelPart, string>>;
    itemKey: string;
    showArrow?: boolean;
    disabled?: boolean;
    onMotionEnd?: () => void;
    header?: Snippet;
    extra?: Snippet;
    children?: Snippet;
}
