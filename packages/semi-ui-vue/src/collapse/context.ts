import type { ComputedRef } from 'vue';
import { createContext } from '../_base/create-context';
import type { CollapseSlots } from './interface';

export interface CollapseView {
    activeSet: Set<string>;
    clickHeaderToExpand: boolean;
    keepDOM: boolean;
    motion: boolean;
    lazyRender: boolean;
    expandIconPosition: 'left' | 'right';
}

export interface CollapseContext {
    view: ComputedRef<CollapseView>;
    /** Collapse's own slots object, which Vue updates in place: a panel reads the icon slots at render time. */
    slots: CollapseSlots;
    onClick: (itemKey: string, event: MouseEvent) => void;
}

export const [provideCollapseContext, useCollapseContext] = createContext<CollapseContext>('Collapse');
