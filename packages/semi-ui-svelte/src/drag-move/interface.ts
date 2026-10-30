// pointerType "mouse" and "pen" report through onMouse*, "touch" through onTouch*
export interface DragMoveOptions {
    /** The element that starts a drag, or a function returning it; defaults to the dragged element itself */
    handler?: HTMLElement | (() => HTMLElement | null);
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
    onMouseDown?: (e: PointerEvent) => void;
    onMouseMove?: (e: PointerEvent) => void;
    onMouseUp?: (e: PointerEvent) => void;
    onTouchStart?: (e: PointerEvent) => void;
    onTouchMove?: (e: PointerEvent) => void;
    onTouchEnd?: (e: PointerEvent) => void;
    onTouchCancel?: (e: PointerEvent) => void;
}
