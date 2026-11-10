import type { ResizeGroupItem } from '@fibrae/semi-foundation/components/resizable/foundation';
import { createContext } from '../../base/index.js';

export interface ResizeGroupContext {
    readonly direction: 'horizontal' | 'vertical';
    // both return the unregister function
    registerItem: (item: ResizeGroupItem) => () => void;
    registerHandler: (handler: HTMLDivElement) => () => void;
    notifyResizeStart: (handler: HTMLDivElement, e: PointerEvent) => void;
    notifyResizing: (handler: HTMLDivElement, e: PointerEvent) => void;
    notifyResizeEnd: (handler: HTMLDivElement, e: PointerEvent) => void;
    /** Returns whether the key moved the handler */
    notifyKeyDown: (handler: HTMLDivElement, e: KeyboardEvent) => boolean;
}

export const [getResizeGroupContext, setResizeGroupContext] = createContext<ResizeGroupContext>('ResizeGroup');
