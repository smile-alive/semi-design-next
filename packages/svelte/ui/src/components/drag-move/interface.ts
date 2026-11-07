// pointerType "mouse" and "pen" report through onMouse*, "touch" through onTouch*
export interface DragMoveOptions {
    handler?: HTMLElement | (() => HTMLElement | null);
    /** The element that bounds the movement; it needs a positioned layout */
    constrainer?: 'parent' | (() => HTMLElement | null);
    allowInputDrag?: boolean;
    /** Called when a pointer goes down: return `false` to not drag */
    allowMove?: (e: PointerEvent, element: HTMLElement) => boolean;
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
