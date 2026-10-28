import type React from 'react';
import { useLayoutEffect, useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
import type { Direction, HandlerCallback } from '@fibrae/semi-foundation/resizable/types';
import { isSecondaryPress } from '@fibrae/semi-foundation/utils/pointer';
import { IconHandle } from '@fibrae/semi-icons-react';
import type { ElementProps } from '../../_base/base';
import useDefaultProps from '../../_base/use-default-props';
import useMergedRef from '../../_base/use-merged-ref';
import useLocale from '../../locale/use-locale';
import { useResizeContext } from './resize-context';

const prefixCls = cssClasses.PREFIX;

export interface ResizeHandlerProps extends ElementProps<'div'> {
    children?: React.ReactNode;
    direction?: Direction;
    onResizeStart?: HandlerCallback;
    className?: string;
    disabled?: boolean;
    style?: React.CSSProperties;
    /** Attached to the handler's root div */
    ref?: React.Ref<HTMLDivElement>;
}

export default function ResizeHandler(rawProps: ResizeHandlerProps) {
    const props = useDefaultProps('ResizeHandler', rawProps, {});

    // direction, onResizeStart and disabled are declared but ignored: the group's direction applies
    const { ref, style, className, children, direction: directionProp, onResizeStart, disabled, ...rest } = props;

    const { direction, registerHandler, notifyResizeStart, notifyResizing, notifyResizeEnd, notifyKeyDown } = useResizeContext('ResizeHandler');
    const { locale } = useLocale('Resizable');

    const handlerRef = useRef<HTMLDivElement>(null);

    const mergedRef = useMergedRef(ref, handlerRef);

    useLayoutEffect(() => registerHandler(handlerRef), [registerHandler]);

    // captured here because nativeEvent.currentTarget is not the handler
    return (
        // the name comes first so a name in rest wins; aria-value* and aria-controls are written by the foundation
        <div
            aria-label={locale.separator}
            {...rest}
            ref={mergedRef}
            className={clsx(className, prefixCls + '-handler', prefixCls + '-handler-' + direction)}
            style={style}
            // the bar between side-by-side panes is vertical
            aria-orientation={direction === 'horizontal' ? 'vertical' : 'horizontal'}
            role="separator"
            tabIndex={0}
            onKeyDown={(e) => {
                rest.onKeyDown?.(e);
                if (notifyKeyDown(handlerRef, e.nativeEvent)) {
                    e.preventDefault();
                }
            }}
            onLostPointerCapture={(e) => {
                rest.onLostPointerCapture?.(e);
                notifyResizeEnd(e.nativeEvent);
            }}
            onPointerDown={(e) => {
                rest.onPointerDown?.(e);
                if (isSecondaryPress(e)) {
                    return;
                }
                e.currentTarget.setPointerCapture(e.pointerId);
                notifyResizeStart(handlerRef, e.nativeEvent);
            }}
            onPointerMove={(e) => {
                rest.onPointerMove?.(e);
                notifyResizing(e.nativeEvent);
            }}
        >
            {children ?? <IconHandle style={{ rotate: direction === 'horizontal' ? '0deg' : '90deg' }} size="inherit" />}
        </div>
    );
}
