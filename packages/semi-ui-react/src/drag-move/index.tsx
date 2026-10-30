import { Fragment, useCallback, type FragmentInstance, type ReactNode } from 'react';
import DragMoveFoundation, { type DragMoveAdapter } from '@fibrae/semi-foundation/drag-move/foundation';
import useDefaultProps from '../_base/use-default-props';
import useDidUpdate from '../_base/use-did-update';
import useFoundation from '../_base/use-foundation';

export interface DragMoveProps {
    // the drag trigger; defaults to the element
    handler?: () => HTMLElement | null;
    // limits the movement range; must be relatively positioned
    constrainer?: 'parent' | (() => HTMLElement | null);
    children?: ReactNode;
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
    customMove?: (e: HTMLElement, top: number, left: number) => void;
    // 'relative' preserves the element's original layout position
    positionStrategy?: 'absolute' | 'relative';
}

const defaultProps = {
    allowInputDrag: false,
    positionStrategy: 'absolute',
} satisfies Partial<DragMoveProps>;

export default function DragMove(rawProps: DragMoveProps) {
    const props = useDefaultProps('DragMove', rawProps, defaultProps);

    const [foundation] = useFoundation<DragMoveFoundation<DragMoveProps>, DragMoveAdapter<DragMoveProps>, DragMoveProps, object>(
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

    // binding through the Fragment covers swapped or added children; ResizeObserver reports each before paint
    const setFragment = useCallback(
        (frag: FragmentInstance | null) => {
            if (!frag) {
                return undefined;
            }
            const observer = new ResizeObserver((entries) => foundation.prepareElements((entries ?? []).map((entry) => entry.target)));
            frag.observeUsing(observer);
            frag.addEventListener('pointerdown', foundation.handlePointerDown);
            return () => {
                frag.removeEventListener('pointerdown', foundation.handlePointerDown);
                frag.unobserveUsing(observer);
                observer.disconnect();
            };
        },
        [foundation]
    );

    useDidUpdate(props.positionStrategy, foundation.updatePositionStrategy);

    return <Fragment ref={setFragment}>{props.children}</Fragment>;
}
