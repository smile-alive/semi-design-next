import type { ComputedRef } from 'vue';
import { createContext } from '../../base/index';
import type { CollapseProps, CollapseSlots } from './interface';

export interface CollapseView {
    classNames: CollapseProps['classNames'];
    styles: CollapseProps['styles'];
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
