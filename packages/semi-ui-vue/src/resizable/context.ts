import type { ComputedRef } from 'vue';
import type { ResizeGroupItem } from '@fibrae/semi-foundation/components/resizable/foundation';
import { createContext } from '../_base/create-context';

export interface ResizeGroupView {
    direction: 'horizontal' | 'vertical';
}

export interface ResizeGroupContext {
    view: ComputedRef<ResizeGroupView>;
    // both return the unregister function
    registerItem: (item: ResizeGroupItem) => () => void;
    registerHandler: (handler: HTMLDivElement) => () => void;
    notifyResizeStart: (handler: HTMLDivElement, e: PointerEvent) => void;
    notifyResizing: (handler: HTMLDivElement, e: PointerEvent) => void;
    notifyResizeEnd: (handler: HTMLDivElement, e: PointerEvent) => void;
    notifyKeyDown: (handler: HTMLDivElement, e: KeyboardEvent) => boolean;
}

export const [provideResizeGroupContext, useResizeGroupContext] = createContext<ResizeGroupContext>('ResizeGroup');
