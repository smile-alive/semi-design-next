import type { ComputedRef } from 'vue';
import type { ResizeCallback, ResizeStartCallback } from '@fibrae/semi-foundation/resizable/types';
import { createContext } from '../_base/create-context';

/** What the group reads from an item; the functions read the item's current props at each call */
export interface ResizeItemEntry {
    el: HTMLDivElement;
    min: () => string | undefined;
    max: () => string | undefined;
    defaultSize: () => string | number | undefined;
    start: ResizeStartCallback;
    change: ResizeCallback;
    end: ResizeCallback;
}

export interface ResizeGroupView {
    direction: 'horizontal' | 'vertical';
}

export interface ResizeGroupContext {
    view: ComputedRef<ResizeGroupView>;
    // registration order is layout order; both return the unregister function
    registerItem: (entry: ResizeItemEntry) => () => void;
    registerHandler: (handler: HTMLDivElement) => () => void;
    notifyResizeStart: (handler: HTMLDivElement, e: PointerEvent) => void;
    notifyResizing: (handler: HTMLDivElement, e: PointerEvent) => void;
    notifyResizeEnd: (handler: HTMLDivElement, e: PointerEvent) => void;
    /** Returns whether the key moved the handler */
    notifyKeyDown: (handler: HTMLDivElement, e: KeyboardEvent) => boolean;
}

export const [provideResizeGroupContext, useResizeGroupContext] = createContext<ResizeGroupContext>('ResizeGroup');
