import type { RefObject } from 'react';
import { createContext } from '../../_base/create-context';
import type { ResizeItemProps } from './resize-item';

export interface ResizeContextProps {
    direction: 'horizontal' | 'vertical';
    registerItem: (ref: RefObject<HTMLDivElement | null>, props: RefObject<ResizeItemProps>) => () => void;
    registerHandler: (ref: RefObject<HTMLDivElement | null>) => () => void;
    notifyResizeStart: (handler: RefObject<HTMLDivElement | null>, e: PointerEvent) => void;
    notifyResizing: (e: PointerEvent) => void;
    notifyResizeEnd: (e: PointerEvent) => void;
    /** Returns whether the key moved the handler */
    notifyKeyDown: (handler: RefObject<HTMLDivElement | null>, e: KeyboardEvent) => boolean;
}

export const [ResizeContext, useResizeContext] = createContext<ResizeContextProps>('ResizeGroup');
