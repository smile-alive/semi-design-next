import type { Accessor } from 'solid-js';
import type { ResizeCallback, ResizeStartCallback } from '@fibrae/semi-foundation/resizable/types';
import { createContext } from '../_base/create-context';

export interface ResizeItemEntry {
    el: HTMLDivElement;
    min: () => string | undefined;
    max: () => string | undefined;
    defaultSize: () => string | number | undefined;
    start: ResizeStartCallback;
    change: ResizeCallback;
    end: ResizeCallback;
}

export interface ResizeGroupContextValue {
    view: Accessor<{ direction: 'horizontal' | 'vertical' }>;
    /** Returns the function that removes the entry */
    registerItem: (entry: ResizeItemEntry) => () => void;
    registerHandler: (handler: HTMLDivElement) => () => void;
    notifyResizeStart: (handler: HTMLDivElement, e: PointerEvent) => void;
    notifyResizing: (handler: HTMLDivElement, e: PointerEvent) => void;
    notifyResizeEnd: (handler: HTMLDivElement, e: PointerEvent) => void;
    /** Returns whether the key moved the handler */
    notifyKeyDown: (handler: HTMLDivElement, e: KeyboardEvent) => boolean;
}

export const [ResizeGroupContext, useResizeGroupContext] = createContext<ResizeGroupContextValue>('ResizeGroup');
