import type { Attachment } from 'svelte/attachments';
import { createContext } from '../_base/create-context.js';

// The fields are getters over the item's props, so the handle follows a locale change
export interface SortableItemContext {
    readonly label: string;
    readonly roleDescription: string;
    readonly prefix: string;
    attachHandle: Attachment<HTMLElement>;
}

export const [getSortableItemContext, setSortableItemContext] = createContext<SortableItemContext>('SortableItem', { optional: true });
