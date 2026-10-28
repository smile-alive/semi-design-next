import type { VNode } from 'vue';

export interface DragMoveProps {
    /** The element that starts a drag; defaults to the dragged child itself */
    handler?: () => HTMLElement | null;
    /** The element that bounds the movement; it needs a positioned layout */
    constrainer?: 'parent' | (() => HTMLElement | null);
    /** Whether pressing on a native input or textarea starts a drag */
    allowInputDrag?: boolean;
    /** Called when a pointer goes down: return `false` to not drag */
    allowMove?: (e: PointerEvent, element: HTMLElement) => boolean;
    /** Takes the new position instead of the element's top and left */
    customMove?: (element: HTMLElement, top: number, left: number) => void;
    /** `relative` keeps the element's place in the layout */
    positionStrategy?: 'absolute' | 'relative';
}

// pointerType "mouse" and "pen" report through mouse*, "touch" through touch*
export interface DragMoveEmits {
    mouseDown: [e: PointerEvent];
    mouseMove: [e: PointerEvent];
    mouseUp: [e: PointerEvent];
    touchStart: [e: PointerEvent];
    touchMove: [e: PointerEvent];
    touchEnd: [e: PointerEvent];
    touchCancel: [e: PointerEvent];
}

export interface DragMoveSlots {
    /** Each top-level element, or single-root component, is dragged on its own */
    default?: () => VNode[];
}
