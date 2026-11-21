import type { Snippet } from 'svelte';
import type { ClassValue } from 'svelte/elements';
import type { CollapsePart } from '@fibrae/semi-foundation/components/collapse/constants';
import { createContext } from '../../base/index.js';

export interface CollapseContextValue {
    classNames?: Partial<Record<CollapsePart, ClassValue>>;
    styles?: Partial<Record<CollapsePart, string>>;
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
