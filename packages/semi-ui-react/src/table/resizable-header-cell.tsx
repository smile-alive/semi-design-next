import { memo, useRef, type PointerEvent, type SyntheticEvent, type ThHTMLAttributes } from 'react';
import { cssClasses, numbers } from '@fibrae/semi-foundation/table/constants';
import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';

/** The header cell attributes TableHeaderRow passes, with the resize handlers ResizableTable adds */
export interface ResizableHeaderCellProps extends ThHTMLAttributes<HTMLTableCellElement> {
    onResize?: ResizeFn;
    onResizeStart?: ResizeFn;
    onResizeStop?: ResizeFn;
    width?: number | string;
    /** For compatibility with previous versions, the default value is true. If you don't want to resize, set it to false */
    resize?: boolean;
}

function ResizableHeaderCell({ onResize, onResizeStart, onResizeStop, width, resize, children, ...restProps }: ResizableHeaderCellProps) {
    const press = useRef<{ x: number; width: number; sign: number } | null>(null);

    if (typeof width !== 'number' || resize === false) {
        return <th {...restProps}>{children}</th>;
    }

    const handlePointerDown = (e: PointerEvent<HTMLSpanElement>) => {
        if (isSecondaryPress(e)) {
            return;
        }
        // Keeps the press from starting a text selection, which would break the drag
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        const rtl = getComputedStyle(e.currentTarget.parentElement).direction === 'rtl';
        press.current = { x: e.clientX, width, sign: rtl ? -1 : 1 };
        onResizeStart?.(e);
    };

    const handlePointerMove = (e: PointerEvent<HTMLSpanElement>) => {
        const start = press.current;
        if (start) {
            const dragged = start.width + (e.clientX - start.x) * start.sign;
            onResize?.(e, { size: { width: Math.max(numbers.MIN_RESIZE_WIDTH, dragged) } });
        }
    };

    // The browser releases the capture on pointerup and pointercancel, so lostpointercapture ends every drag
    const handlePointerEnd = (e: PointerEvent<HTMLSpanElement>) => {
        if (press.current) {
            press.current = null;
            onResizeStop?.(e);
        }
    };

    return (
        <th {...restProps}>
            {children}
            <span
                className={`${cssClasses.PREFIX}-resize-handle`}
                // A click ending a drag must not reach the th's sort handler
                onClick={(e) => e.stopPropagation()}
                onLostPointerCapture={handlePointerEnd}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
            />
        </th>
    );
}

// The second argument carries the new width for onResize
export type ResizeFn = (e: SyntheticEvent, data?: { size: { width: number } }) => any;

export default memo(ResizableHeaderCell);
