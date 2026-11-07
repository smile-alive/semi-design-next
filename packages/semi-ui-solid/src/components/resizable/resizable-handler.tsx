import { type JSX } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/resizable/constants';
import type { Direction, HandlerCallback } from '@fibrae/semi-foundation/components/resizable/types';
import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';

const prefixCls = cssClasses.PREFIX;

interface ResizableHandlerProps {
    children?: JSX.Element;
    direction: Direction;
    onResizeStart: HandlerCallback;
    onResizing: (e: PointerEvent) => void;
    onResizeEnd: (e: PointerEvent) => void;
    class?: string;
    style?: JSX.CSSProperties | string;
    separatorProps?: JSX.HTMLAttributes<HTMLDivElement>;
}

export default function ResizableHandler(props: ResizableHandlerProps) {
    return (
        <div
            {...props.separatorProps}
            class={clsx(props.class, `${prefixCls}-resizableHandler`, `${prefixCls}-resizableHandler-${props.direction}`)}
            style={props.style}
            onLostPointerCapture={(e) => props.onResizeEnd(e)}
            onPointerDown={(e) => {
                if (isSecondaryPress(e)) {
                    return;
                }
                e.currentTarget.setPointerCapture(e.pointerId);
                props.onResizeStart(e, props.direction);
            }}
            onPointerMove={(e) => props.onResizing(e)}
        >
            {props.children}
        </div>
    );
}
