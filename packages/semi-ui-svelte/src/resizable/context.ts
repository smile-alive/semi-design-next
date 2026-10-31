import type { ResizeCallback, ResizeStartCallback } from '@fibrae/semi-foundation/resizable/types';
import { createContext } from '../_base/create-context.js';

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

export interface ResizeGroupContext {
    readonly direction: 'horizontal' | 'vertical';
    // the group orders them by DOM position; both return the unregister function
    registerItem: (entry: ResizeItemEntry) => () => void;
    registerHandler: (handler: HTMLDivElement) => () => void;
    notifyResizeStart: (handler: HTMLDivElement, e: PointerEvent) => void;
    notifyResizing: (handler: HTMLDivElement, e: PointerEvent) => void;
    notifyResizeEnd: (handler: HTMLDivElement, e: PointerEvent) => void;
    /** Returns whether the key moved the handler */
    notifyKeyDown: (handler: HTMLDivElement, e: KeyboardEvent) => boolean;
}

export const [getResizeGroupContext, setResizeGroupContext] = createContext<ResizeGroupContext>('ResizeGroup');
