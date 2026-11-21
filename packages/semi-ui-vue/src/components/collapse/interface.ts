import type { ClassValue, StyleValue, VNode } from 'vue';
import type { CollapsePanelPart, CollapsePart } from '@fibrae/semi-foundation/components/collapse/constants';

export interface CollapseProps {
    classNames?: Partial<Record<CollapsePart, ClassValue>>;
    styles?: Partial<Record<CollapsePart, StyleValue>>;
    /** `null` and `''` are controlled "nothing open" values. */
    activeKey?: string | string[] | null;
    defaultActiveKey?: string | string[];
    accordion?: boolean;
    clickHeaderToExpand?: boolean;
    expandIconPosition?: 'left' | 'right';
    keepDOM?: boolean;
    motion?: boolean;
    lazyRender?: boolean;
}

export interface CollapseEmits {
    'update:activeKey': [activeKey: string[]];
    /** A keyboard toggle is also a click, because the header is a native button. */
    change: [activeKey: string[], event: MouseEvent];
}

export interface CollapseSlots {
    default?: () => VNode[];
    expandIcon?: () => VNode[];
    collapseIcon?: () => VNode[];
}

export interface CollapsePanelProps {
    classNames?: Partial<Record<CollapsePanelPart, ClassValue>>;
    styles?: Partial<Record<CollapsePanelPart, StyleValue>>;
    itemKey: string;
    showArrow?: boolean;
    disabled?: boolean;
}

export interface CollapsePanelEmits {
    motionEnd: [];
}

export interface CollapsePanelSlots {
    default?: () => VNode[];
    header?: () => VNode[];
    /** Outside the toggle button, so it may hold its own controls. */
    extra?: () => VNode[];
}
