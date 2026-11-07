import type { ComputedRef } from 'vue';
import { createContext } from '../../base/create-context';

export interface SortableItemView {
    label: string;
    roleDescription: string;
    prefix: string;
}

export interface SortableItemContext {
    view: ComputedRef<SortableItemView>;
    setHandle: (element: HTMLElement | null) => void;
}

export const [provideSortableItemContext, useSortableItemContext] = createContext<SortableItemContext>('SortableItem', { optional: true });
