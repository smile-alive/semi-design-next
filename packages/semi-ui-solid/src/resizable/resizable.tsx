import { type JSX, For, Show, onCleanup, splitProps } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
import { ResizableFoundation, type ResizableAdapter, type ResizableBaseState } from '@fibrae/semi-foundation/resizable/foundation';
import { type Direction, type Size, type Enable, type ResizeStartCallback, type ResizeCallback, type HandleClassName, directions } from '@fibrae/semi-foundation/resizable/types';
import { isKeyboardEdge } from '@fibrae/semi-foundation/resizable/utils';
import { toCssLength } from '@fibrae/semi-foundation/utils/dom';
import '@fibrae/semi-foundation/resizable/resizable.scss';
import type { ElementProps } from '../_base/element-props';
import mergeRefs from '../_base/merge-refs';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useResizeObserver from '../_base/use-resize-observer';
import { useLocale } from '../locale';
import ResizableHandler from './resizable-handler';
import { joinStyle } from './style';

const prefixCls = cssClasses.PREFIX;

type Style = JSX.CSSProperties | string;

export interface HandleStyle {
    top?: Style;
    right?: Style;
    bottom?: Style;
    left?: Style;
    topRight?: Style;
    bottomRight?: Style;
    bottomLeft?: Style;
    topLeft?: Style;
}

export interface ResizableProps extends ElementProps<'div', 'onChange'> {
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
    handleWrapperStyle?: Style;
    handleWrapperClass?: string;
    /** Content of each enabled handle, in place of the default grip icon */
    renderHandle?: (direction: Direction) => JSX.Element;
    onResizeStart?: ResizeStartCallback;
    onChange?: ResizeCallback;
    onResizeEnd?: ResizeCallback;
    defaultSize?: Size;
    scale?: number;
    ratio?: number | [number, number];
}

type Foundation = ResizableFoundation<ResizableProps>;
type Adapter = ResizableAdapter<ResizableProps>;

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

    const [local, rest] = splitProps(props, [
        'ref',
        'class',
        'style',
        'children',
        'grid',
        'snap',
        'snapGap',
        'boundElement',
        'boundsByDirection',
        'size',
        'minWidth',
        'minHeight',
        'maxWidth',
        'maxHeight',
        'lockAspectRatio',
        'lockAspectRatioExtraWidth',
        'lockAspectRatioExtraHeight',
        'enable',
        'handleStyle',
        'handleClass',
        'handleWrapperStyle',
        'handleWrapperClass',
        'renderHandle',
        'onResizeStart',
        'onChange',
        'onResizeEnd',
        'defaultSize',
        'scale',
        'ratio',
    ]);

    const locale = useLocale('Resizable');

    let resizable: HTMLDivElement | undefined;
    let disposed = false;

    const { foundation, state } = useFoundation<Foundation, Adapter, ResizableProps, ResizableBaseState>(
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
            getResizable: () => resizable ?? null,
            notifyResizeStart: (e, direction) => base.getProps().onResizeStart?.(e, direction),
            notifyChange: (size, event, direction) => base.getProps().onChange?.(size, event, direction),
            notifyResizeEnd: (size, event, direction) => base.getProps().onResizeEnd?.(size, event, direction),
        })
    );

    const resizeStyle = () => {
        const { flexBasis } = state();
        return joinStyle(
            {
                'user-select': state().isResizing ? 'none' : 'auto',
                'max-width': toCssLength(local.maxWidth),
                'max-height': toCssLength(local.maxHeight),
                'min-width': toCssLength(local.minWidth),
                'min-height': toCssLength(local.minHeight),
            },
            local.style,
            ResizableFoundation.getSizeStyle(props, state()),
            flexBasis ? { 'flex-basis': toCssLength(flexBasis) } : undefined
        );
    };

    const separatorProps = (dir: Direction): JSX.HTMLAttributes<HTMLDivElement> | undefined => {
        const enable = local.enable;
        if (!enable || !isKeyboardEdge(enable, dir)) {
            return undefined;
        }
        const horizontal = dir === 'right' || dir === 'left';
        const range = state().ariaRange?.[horizontal ? 'width' : 'height'];
        return {
            role: 'separator',
            tabIndex: 0,
            'aria-orientation': horizontal ? 'vertical' : 'horizontal',
            'aria-label': horizontal ? locale().locale.resizeWidth : locale().locale.resizeHeight,
            'aria-valuenow': range && Math.round(range.now),
            'aria-valuemin': range && Math.round(range.min),
            'aria-valuemax': range && Math.round(range.max),
            onKeyDown: (e) => {
                if (foundation.resizeByKey(dir, e)) {
                    e.preventDefault();
                }
            },
        };
    };

    useResizeObserver(
        () => resizable,
        () => foundation.updateAriaRange()
    );

    onCleanup(() => {
        disposed = true;
    });

    return (
        <div role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as JSX.HTMLAttributes<HTMLDivElement>['role']} {...rest} ref={mergeRefs(local.ref, (node: HTMLDivElement) => (resizable = node))} class={clsx(local.class, `${prefixCls}-resizable`)} style={resizeStyle()}>
            <Show when={state().isResizing}>
                <div class={`${prefixCls}-background`} style={state().backgroundStyle} />
            </Show>
            {local.children}
            <Show when={local.enable}>
                {(enable) => (
                    <div class={local.handleWrapperClass} style={local.handleWrapperStyle}>
                        <For each={directions}>
                            {(dir) => (
                                <Show when={enable()[dir] !== false}>
                                    <ResizableHandler
                                        class={local.handleClass?.[dir]}
                                        style={local.handleStyle?.[dir]}
                                        direction={dir}
                                        separatorProps={separatorProps(dir)}
                                        // a drag cut short by unmounting still delivers its release to the detached handle
                                        onResizeEnd={(e) => !disposed && foundation.onResizeEnd(e)}
                                        onResizeStart={foundation.onResizeStart}
                                        onResizing={foundation.onResizing}
                                    >
                                        <Show keyed when={local.renderHandle}>
                                            {(render) => render(dir)}
                                        </Show>
                                    </ResizableHandler>
                                </Show>
                            )}
                        </For>
                    </div>
                )}
            </Show>
        </div>
    );
}
