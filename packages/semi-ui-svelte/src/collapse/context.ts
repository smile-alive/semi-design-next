import type { Snippet } from 'svelte';
import { createContext } from '../_base/create-context.js';

export interface CollapseContextValue {
    activeSet: Set<string>;
    clickHeaderToExpand: boolean;
    // Resolved in Collapse, so a panel's aria-controls follows the same value as the Collapsible it points at
    keepDOM: boolean;
    motion: boolean;
    lazyRender: boolean;
    expandIconPosition: 'left' | 'right';
    expandIcon?: Snippet;
    collapseIcon?: Snippet;
    onClick: (itemKey: string, event: MouseEvent) => void;
}

export const [getCollapseContext, setCollapseContext] = createContext<CollapseContextValue>('Collapse');
