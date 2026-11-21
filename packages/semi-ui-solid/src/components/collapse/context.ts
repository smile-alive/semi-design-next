import type { Accessor, JSX } from 'solid-js';
import type { CollapsePart } from '@fibrae/semi-foundation/components/collapse/constants';
import { createContext } from '../../base/index';

export interface CollapseView {
    classNames?: Partial<Record<CollapsePart, string>>;
    styles?: Partial<Record<CollapsePart, JSX.CSSProperties | string>>;
    activeSet: Set<string>;
    clickHeaderToExpand: boolean;
    /** undefined defers to the global Collapsible default */
    keepDOM?: boolean;
    motion?: boolean;
    lazyRender: boolean;
    expandIconPosition: 'left' | 'right';
}

export interface CollapseContextValue {
    view: Accessor<CollapseView>;
    /** Read through `children()` once per panel: every read of the prop creates new nodes, and a node fits one place */
    expandIcon: Accessor<JSX.Element>;
    collapseIcon: Accessor<JSX.Element>;
    onClick: (itemKey: string, event: MouseEvent) => void;
}

export const [CollapseContext, useCollapseContext] = createContext<CollapseContextValue>('Collapse');
