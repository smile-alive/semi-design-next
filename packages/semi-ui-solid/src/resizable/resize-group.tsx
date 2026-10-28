import { type JSX, Show, createEffect, createMemo, on, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
import { ResizeGroupFoundation, type ResizeGroupAdapter, type ResizeGroupBaseState } from '@fibrae/semi-foundation/resizable/foundation';
import '@fibrae/semi-foundation/resizable/resizable.scss';
import type { ElementProps } from '../_base/element-props';
import mergeRefs from '../_base/merge-refs';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useEventListener from '../_base/use-event-listener';
import useFoundation from '../_base/use-foundation';
import useResizeObserver from '../_base/use-resize-observer';
import { ResizeGroupContext, type ResizeGroupContextValue, type ResizeItemEntry } from './context';
import { joinStyle } from './style';

const prefixCls = cssClasses.PREFIX;

export interface ResizeGroupProps extends ElementProps<'div'> {
    direction?: 'horizontal' | 'vertical';
}

type Foundation = ResizeGroupFoundation<ResizeGroupProps>;
type Adapter = ResizeGroupAdapter<ResizeGroupProps>;

const defaultProps = {
    direction: 'horizontal',
} satisfies Partial<ResizeGroupProps>;

const inDocumentOrder = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

export default function ResizeGroup(rawProps: ResizeGroupProps) {
    const props = useDefaultProps('ResizeGroup', rawProps, defaultProps);
    const [local, rest] = splitProps(props, ['ref', 'class', 'style', 'children', 'direction']);

    let group: HTMLDivElement | undefined;

    // Entries register in ref callbacks, before any mount hook runs, so the foundation finds them at init. Index =
    // layout order, which is DOM order; it is read on use because items can come and go later.
    const items: ResizeItemEntry[] = [];
    const handlers: HTMLDivElement[] = [];
    const view = createMemo(() => ({ direction: props.direction }));

    const orderedItems = () => items.toSorted((a, b) => inDocumentOrder(a.el, b.el));

    const orderedHandlers = () => handlers.toSorted(inDocumentOrder);

    const { foundation, state } = useFoundation<Foundation, Adapter, ResizeGroupProps, ResizeGroupBaseState>(
        ResizeGroupFoundation,
        props,
        () => ({
            isResizing: false,
            originalPosition: { x: 0, y: 0, lastItemSize: 0, nextItemSize: 0 },
            backgroundStyle: { cursor: 'auto' },
            curHandler: null,
        }),
        () => ({
            getGroupRef: () => group ?? null,
            getItem: (index) => orderedItems()[index].el,
            getItemCount: () => items.length,
            getHandler: (index) => orderedHandlers()[index],
            getHandlerCount: () => handlers.length,
            getItemMin: (index) => orderedItems()[index].min(),
            getItemMax: (index) => orderedItems()[index].max(),
            getItemStart: (index) => orderedItems()[index].start,
            getItemChange: (index) => orderedItems()[index].change,
            getItemEnd: (index) => orderedItems()[index].end,
            getItemDefaultSize: (index) => orderedItems()[index].defaultSize(),
        })
    );

    const remove =
        <T,>(list: T[], value: T) =>
        () => {
            const index = list.indexOf(value);
            if (index >= 0) {
                list.splice(index, 1);
            }
        };

    // A handler that left the group (unmounted mid-drag) still receives the pointer's last events on its detached
    // element; those are ignored.
    const handlerIndex = (handler: HTMLDivElement) => orderedHandlers().indexOf(handler);

    const context: ResizeGroupContextValue = {
        view,
        registerItem: (entry) => {
            items.push(entry);
            return remove(items, entry);
        },
        registerHandler: (handler) => {
            handlers.push(handler);
            return remove(handlers, handler);
        },
        notifyResizeStart: (handler, e) => {
            const index = handlerIndex(handler);
            if (index >= 0) {
                foundation.onResizeStart(index, e);
            }
        },
        notifyResizing: (handler, e) => {
            if (handlerIndex(handler) >= 0) {
                foundation.onResizing(e);
            }
        },
        notifyResizeEnd: (handler, e) => {
            if (handlerIndex(handler) >= 0) {
                foundation.onResizeEnd(e);
            }
        },
        notifyKeyDown: (handler, e) => {
            const index = handlerIndex(handler);
            return index >= 0 && foundation.resizeByKey(index, e);
        },
    };

    createEffect(
        on(
            createMemo(() => props.direction),
            () => foundation.handleDirectionChange(),
            { defer: true }
        )
    );

    // vw and vh limits change with the window even when the group keeps its size
    useEventListener(
        () => window,
        'resize',
        () => foundation.ensureConstraint()
    );

    useResizeObserver(
        () => group,
        () => {
            // a group first mounted inside display:none measures 0: lay out again once it becomes measurable. #3336
            foundation.handleGroupResize();
            // a container resize without a window resize can leave px limits violated
            foundation.ensureConstraint();
        }
    );

    return (
        <ResizeGroupContext.Provider value={context}>
            <div
                role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as JSX.HTMLAttributes<HTMLDivElement>['role']}
                {...rest}
                // the Provider's children memo tracks the ref read; a spread props signal would rebuild the group and its panes
                ref={untrack(() => mergeRefs(local.ref, (node: HTMLDivElement) => (group = node)))}
                class={clsx(local.class, `${prefixCls}-group`)}
                style={joinStyle(local.style, { 'flex-direction': props.direction === 'vertical' ? 'column' : 'row' })}
            >
                <Show when={state().isResizing}>
                    <div class={`${prefixCls}-background`} style={state().backgroundStyle} />
                </Show>
                {local.children}
            </div>
        </ResizeGroupContext.Provider>
    );
}
