import { type JSX, Show, splitProps } from 'solid-js';
import { cssClasses, numbers } from '@fibrae/semi-foundation/table/constants';
import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';

/** The second argument carries the new width for onResize */
export type ResizeHandler = (e: PointerEvent, data?: { size: { width: number } }) => void;

/** The header cell attributes TableHeaderRow passes, with the resize handlers ResizableTable adds */
export interface ResizableHeaderCellProps extends Omit<JSX.ThHTMLAttributes<HTMLTableCellElement>, 'onResize'> {
    onResize?: ResizeHandler;
    onResizeStart?: ResizeHandler;
    onResizeStop?: ResizeHandler;
    width?: number | string;
    /** false leaves the column without a resize handle */
    resize?: boolean;
}

type HandleEvent = PointerEvent & { currentTarget: HTMLSpanElement; target: Element };

export default function ResizableHeaderCell(props: ResizableHeaderCellProps) {
    const [local, rest] = splitProps(props, ['onResize', 'onResizeStart', 'onResizeStop', 'width', 'resize', 'children']);

    let press: { x: number; width: number; sign: number } | null = null;

    const handlePointerDown = (e: HandleEvent) => {
        if (isSecondaryPress(e) || typeof local.width !== 'number') {
            return;
        }
        // Keeps the press from starting a text selection, which would break the drag
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const rtl = getComputedStyle(e.currentTarget.parentElement as HTMLElement).direction === 'rtl';
        press = { x: e.clientX, width: local.width, sign: rtl ? -1 : 1 };
        local.onResizeStart?.(e);
    };

    const handlePointerMove = (e: HandleEvent) => {
        if (press) {
            const dragged = press.width + (e.clientX - press.x) * press.sign;
            local.onResize?.(e, { size: { width: Math.max(numbers.MIN_RESIZE_WIDTH, dragged) } });
        }
    };

    // The browser releases the capture on pointerup and pointercancel, so lostpointercapture ends every drag
    const handlePointerEnd = (e: HandleEvent) => {
        if (press) {
            press = null;
            local.onResizeStop?.(e);
        }
    };

    return (
        <th {...rest}>
            {local.children}
            <Show when={typeof local.width === 'number' && local.resize !== false}>
                <span
                    class={`${cssClasses.PREFIX}-resize-handle`}
                    // A click ending a drag must not reach the th's sort handler
                    onClick={(e) => e.stopPropagation()}
                    onLostPointerCapture={handlePointerEnd}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                />
            </Show>
        </th>
    );
}
