import type React from 'react';
import { useRef } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
import { ResizableFoundation, type ResizableAdapter, type ResizableBaseState } from '@fibrae/semi-foundation/resizable/foundation';
import { type Direction, type Size, type Enable, type ResizeStartCallback, type ResizeCallback, type HandleClassName, directions } from '@fibrae/semi-foundation/resizable/types';
import { isKeyboardEdge } from '@fibrae/semi-foundation/resizable/utils';
import '@fibrae/semi-foundation/resizable/resizable.scss';
import type { ElementProps } from '../../_base/base';
import { namedRole } from '../../_base/named-role';
import useDefaultProps from '../../_base/use-default-props';
import useFoundation from '../../_base/use-foundation';
import useMergedRef from '../../_base/use-merged-ref';
import useResizeObserver from '../../_base/use-resize-observer';
import useLocale from '../../locale/use-locale';
import ResizableHandler from './resizable-handler';

const prefixCls = cssClasses.PREFIX;
export interface HandleComponent {
    top?: React.ReactNode;
    right?: React.ReactNode;
    bottom?: React.ReactNode;
    left?: React.ReactNode;
    topRight?: React.ReactNode;
    bottomRight?: React.ReactNode;
    bottomLeft?: React.ReactNode;
    topLeft?: React.ReactNode;
}

export interface HandleStyle {
    top?: React.CSSProperties;
    right?: React.CSSProperties;
    bottom?: React.CSSProperties;
    left?: React.CSSProperties;
    topRight?: React.CSSProperties;
    bottomRight?: React.CSSProperties;
    bottomLeft?: React.CSSProperties;
    topLeft?: React.CSSProperties;
}

export interface ResizableProps extends ElementProps<'div', 'onChange'> {
    style?: React.CSSProperties;
    className?: string;
    grid?: [number, number];
    snap?: {
        x?: number[];
        y?: number[];
    };
    snapGap?: number;
    boundElement?: 'parent' | 'window' | HTMLElement;
    boundsByDirection?: boolean;
    size?: Size;
    minWidth?: string | number;
    minHeight?: string | number;
    maxWidth?: string | number;
    maxHeight?: string | number;
    lockAspectRatio?: boolean | number;
    lockAspectRatioExtraWidth?: number;
    lockAspectRatioExtraHeight?: number;
    enable?: Enable | false;
    handleStyle?: HandleStyle;
    handleClass?: HandleClassName;
    handleWrapperStyle?: React.CSSProperties;
    handleWrapperClass?: string;
    handleNode?: HandleComponent;
    children?: React.ReactNode;
    onResizeStart?: ResizeStartCallback;
    onChange?: ResizeCallback;
    onResizeEnd?: ResizeCallback;
    defaultSize?: Size;
    scale?: number;
    ratio?: number | [number, number];
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = {
    enable: {
        top: true,
        right: true,
        bottom: true,
        left: true,
        topRight: true,
        bottomRight: true,
        bottomLeft: true,
        topLeft: true,
    },
    grid: [1, 1],
    lockAspectRatio: false,
    lockAspectRatioExtraWidth: 0,
    lockAspectRatioExtraHeight: 0,
    scale: 1,
    ratio: 1,
    snapGap: 0,
} satisfies Partial<ResizableProps>;

export default function Resizable(rawProps: ResizableProps) {
    const props = useDefaultProps('Resizable', rawProps, defaultProps);

    const {
        ref,
        className,
        style,
        children,
        grid,
        snap,
        snapGap,
        boundElement,
        boundsByDirection,
        size,
        minWidth,
        minHeight,
        maxWidth,
        maxHeight,
        lockAspectRatio,
        lockAspectRatioExtraWidth,
        lockAspectRatioExtraHeight,
        enable,
        handleStyle,
        handleClass,
        handleWrapperStyle,
        handleWrapperClass,
        handleNode,
        onResizeStart,
        onChange,
        onResizeEnd,
        defaultSize,
        scale,
        ratio,
        ...rest
    } = props;

    const { locale } = useLocale('Resizable');

    const resizableRef = useRef<HTMLDivElement>(null);

    const [foundation, state] = useFoundation<ResizableFoundation<ResizableProps>, ResizableAdapter<ResizableProps>, ResizableProps, ResizableBaseState>(
        ResizableFoundation,
        props,
        () => {
            const propSize = ResizableFoundation.getPropSize(props);
            return {
                isResizing: false,
                width: propSize.width ?? 'auto',
                height: propSize.height ?? 'auto',
                direction: 'right',
                original: { x: 0, y: 0, width: 0, height: 0 },
                backgroundStyle: { cursor: 'auto' },
                flexBasis: undefined,
            };
        },
        (base) => ({
            getResizable: () => resizableRef.current,
            notifyResizeStart: (e, direction) => base.getProps().onResizeStart?.(e, direction),
            notifyChange: (size, event, direction) => base.getProps().onChange?.(size, event, direction),
            notifyResizeEnd: (size, event, direction) => base.getProps().onResizeEnd?.(size, event, direction),
        })
    );

    const mergedRef = useMergedRef(ref, resizableRef);

    const resizeStyle: React.CSSProperties = {
        userSelect: state.isResizing ? 'none' : 'auto',
        maxWidth,
        maxHeight,
        minWidth,
        minHeight,
        ...style,
        ...ResizableFoundation.getSizeStyle(props, state),
        ...(state.flexBasis ? { flexBasis: state.flexBasis } : {}),
    };

    const getSeparatorProps = (dir: Direction): React.HTMLAttributes<HTMLDivElement> | undefined => {
        if (!enable || !isKeyboardEdge(enable, dir)) {
            return undefined;
        }
        const horizontal = dir === 'right' || dir === 'left';
        const range = state.ariaRange?.[horizontal ? 'width' : 'height'];
        return {
            role: 'separator',
            tabIndex: 0,
            'aria-orientation': horizontal ? 'vertical' : 'horizontal',
            'aria-label': horizontal ? locale.resizeWidth : locale.resizeHeight,
            'aria-valuenow': range && Math.round(range.now),
            'aria-valuemin': range && Math.round(range.min),
            'aria-valuemax': range && Math.round(range.max),
            onKeyDown: (e) => {
                if (foundation.resizeByKey(dir, e.nativeEvent)) {
                    e.preventDefault();
                }
            },
        };
    };

    useResizeObserver(resizableRef, foundation.updateAriaRange);

    return (
        <div role={namedRole(rest)} {...rest} ref={mergedRef} className={clsx(className, prefixCls + '-resizable')} style={resizeStyle}>
            {state.isResizing && <div className={prefixCls + '-background'} style={state.backgroundStyle} />}
            {children}
            {enable && (
                <div className={handleWrapperClass} style={handleWrapperStyle}>
                    {directions.map(
                        (dir) =>
                            enable[dir] !== false && (
                                <ResizableHandler key={dir} className={handleClass?.[dir]} style={handleStyle?.[dir]} direction={dir} separatorProps={getSeparatorProps(dir)} onResizeEnd={foundation.onResizeEnd} onResizeStart={foundation.onResizeStart} onResizing={foundation.onResizing}>
                                    {handleNode?.[dir] ?? null}
                                </ResizableHandler>
                            )
                    )}
                </div>
            )}
        </div>
    );
}
