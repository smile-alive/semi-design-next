import type React from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
import type { Direction, HandlerCallback } from '@fibrae/semi-foundation/resizable/types';
import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';

const prefixCls = cssClasses.PREFIX;

export interface ResizableHandlerProps {
    children?: React.ReactNode;
    direction?: Direction;
    onResizeStart?: HandlerCallback;
    onResizing?: (e: PointerEvent) => void;
    onResizeEnd?: (e: PointerEvent) => void;
    className?: string;
    disabled?: boolean;
    style?: React.CSSProperties;
    /** Role, name, values and keys of a handle the keyboard can reach */
    separatorProps?: React.HTMLAttributes<HTMLDivElement>;
}

export default function ResizableHandler({ children, direction, onResizeStart, onResizing, onResizeEnd, className, style, separatorProps }: ResizableHandlerProps) {
    // captured here because nativeEvent.currentTarget is not the handle
    return (
        <div
            {...separatorProps}
            className={clsx(className, prefixCls + '-resizableHandler', prefixCls + '-resizableHandler-' + direction)}
            style={style}
            onLostPointerCapture={(e) => onResizeEnd(e.nativeEvent)}
            onPointerDown={(e) => {
                if (isSecondaryPress(e)) {
                    return;
                }
                e.currentTarget.setPointerCapture(e.pointerId);
                onResizeStart(e.nativeEvent, direction);
            }}
            onPointerMove={(e) => onResizing(e.nativeEvent)}
        >
            {children}
        </div>
    );
}
