import { type JSX, children, createEffect, onCleanup } from 'solid-js';
import DragMoveFoundation, { type DragMoveAdapter } from '@fibrae/semi-foundation/drag-move/foundation';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useWatch from '../_base/use-watch';

export interface DragMoveProps {
    // the drag trigger; defaults to the element
    handler?: () => HTMLElement | null;
    // limits the movement range; must be relatively positioned
    constrainer?: 'parent' | (() => HTMLElement | null);
    children?: JSX.Element;
    allowInputDrag?: boolean;
    // pointerType "mouse" or "pen" reports through onMouse*, "touch" through onTouch*
    onMouseDown?: (e: PointerEvent) => void;
    onMouseMove?: (e: PointerEvent) => void;
    onMouseUp?: (e: PointerEvent) => void;
    onTouchStart?: (e: PointerEvent) => void;
    onTouchMove?: (e: PointerEvent) => void;
    onTouchEnd?: (e: PointerEvent) => void;
    onTouchCancel?: (e: PointerEvent) => void;
    // return false to prevent a drag from starting on pointer down
    allowMove?: (e: PointerEvent, element: HTMLElement) => boolean;
    customMove?: (element: HTMLElement, top: number, left: number) => void;
    // 'relative' preserves the element's original layout position
    positionStrategy?: 'absolute' | 'relative';
}

type Foundation = DragMoveFoundation<DragMoveProps>;
type Adapter = DragMoveAdapter<DragMoveProps>;

const defaultProps = {
    allowInputDrag: false,
    positionStrategy: 'absolute',
} satisfies Partial<DragMoveProps>;

export default function DragMove(rawProps: DragMoveProps) {
    const props = useDefaultProps('DragMove', rawProps, defaultProps);

    const bound = new Set<HTMLElement>();
    let observer: ResizeObserver | undefined;

    const { foundation } = useFoundation<Foundation, Adapter, DragMoveProps, object>(
        DragMoveFoundation,
        props,
        () => ({}),
        (base) => ({
            notifyMouseDown: (e) => base.getProps().onMouseDown?.(e),
            notifyMouseMove: (e) => base.getProps().onMouseMove?.(e),
            notifyMouseUp: (e) => base.getProps().onMouseUp?.(e),
            notifyTouchStart: (e) => base.getProps().onTouchStart?.(e),
            notifyTouchMove: (e) => base.getProps().onTouchMove?.(e),
            notifyTouchEnd: (e) => base.getProps().onTouchEnd?.(e),
            notifyTouchCancel: (e) => base.getProps().onTouchCancel?.(e),
        })
    );

    const resolved = children(() => props.children);

    const unbind = (element: HTMLElement) => {
        element.removeEventListener('pointerdown', foundation.handlePointerDown);
        observer?.unobserve(element);
        bound.delete(element);
    };

    // binding follows the resolved children, so swapped or added elements are covered; text nodes cannot be dragged
    createEffect(() => {
        const elements = resolved.toArray().filter((node): node is HTMLElement => node instanceof HTMLElement);
        for (const element of bound) {
            if (!elements.includes(element)) {
                unbind(element);
            }
        }
        for (const element of elements) {
            if (!bound.has(element)) {
                // ResizeObserver reports each child before paint, when the position strategy and the move cursor are applied
                observer ??= new ResizeObserver((entries) => foundation.prepareElements(entries.map((entry) => entry.target)));
                element.addEventListener('pointerdown', foundation.handlePointerDown);
                observer.observe(element);
                bound.add(element);
            }
        }
    });

    useWatch(
        () => props.positionStrategy,
        () => foundation.updatePositionStrategy()
    );

    onCleanup(() => {
        for (const element of bound) {
            element.removeEventListener('pointerdown', foundation.handlePointerDown);
        }
        bound.clear();
        observer?.disconnect();
    });

    return <>{resolved()}</>;
}
