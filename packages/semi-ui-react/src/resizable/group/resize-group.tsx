import type React from 'react';
import { type RefObject, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/resizable/constants';
import { ResizeGroupFoundation, type ResizeGroupAdapter, type ResizeGroupBaseState } from '@fibrae/semi-foundation/resizable/foundation';
import '@fibrae/semi-foundation/resizable/resizable.scss';
import type { ElementProps } from '../../_base/base';
import { namedRole } from '../../_base/named-role';
import useDefaultProps from '../../_base/use-default-props';
import useDidUpdate from '../../_base/use-did-update';
import useEventListener, { getWindow } from '../../_base/use-event-listener';
import useFoundation from '../../_base/use-foundation';
import useMergedRef from '../../_base/use-merged-ref';
import useResizeObserver from '../../_base/use-resize-observer';
import { ResizeContext } from './resize-context';
import type { ResizeItemProps } from './resize-item';

const prefixCls = cssClasses.PREFIX;

export interface ResizeGroupProps extends ElementProps<'div'> {
    children?: React.ReactNode;
    direction?: 'horizontal' | 'vertical';
    className?: string;
    /** Attached to the group's root div */
    ref?: React.Ref<HTMLDivElement>;
}

const defaultProps = {
    direction: 'horizontal',
} satisfies Partial<ResizeGroupProps>;

type ElementRef = RefObject<HTMLDivElement | null>;

// registered refs are attached: layout effects run after the elements mount
const inDocumentOrder = (a: ElementRef, b: ElementRef) => ((a.current as Node).compareDocumentPosition(b.current as Node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);

const orderedItems = (items: Map<ElementRef, RefObject<ResizeItemProps>>) => [...items].sort(([a], [b]) => inDocumentOrder(a, b));

const orderedHandlers = (handlers: Set<ElementRef>) => [...handlers].sort(inDocumentOrder);

export default function ResizeGroup(rawProps: ResizeGroupProps) {
    const props = useDefaultProps('ResizeGroup', rawProps, defaultProps);
    const { ref, children, direction, className, ...rest } = props;

    const groupRef = useRef<HTMLDivElement>(null);

    // Children register in layout effects: tree order on mount, but an item inserted later registers last. Index =
    // layout order, which is DOM order; it is read on use because items can come and go.
    const [items] = useState(() => new Map<RefObject<HTMLDivElement | null>, RefObject<ResizeItemProps>>());
    const [handlers] = useState(() => new Set<RefObject<HTMLDivElement | null>>());

    const [foundation, state] = useFoundation<ResizeGroupFoundation<ResizeGroupProps>, ResizeGroupAdapter<ResizeGroupProps>, ResizeGroupProps, ResizeGroupBaseState>(
        ResizeGroupFoundation,
        props,
        () => ({
            isResizing: false,
            originalPosition: { x: 0, y: 0, lastItemSize: 0, nextItemSize: 0 },
            backgroundStyle: { cursor: 'auto' },
            curHandler: null,
        }),
        () => {
            const itemProps = (index: number) => orderedItems(items)[index][1].current;
            return {
                getGroupRef: () => groupRef.current,
                getItem: (index) => orderedItems(items)[index][0].current,
                getItemCount: () => items.size,
                getHandler: (index) => orderedHandlers(handlers)[index].current,
                getHandlerCount: () => handlers.size,
                getItemMin: (index) => itemProps(index).min,
                getItemMax: (index) => itemProps(index).max,
                getItemStart: (index) => itemProps(index).onResizeStart,
                getItemChange: (index) => itemProps(index).onChange,
                getItemEnd: (index) => itemProps(index).onResizeEnd,
                getItemDefaultSize: (index) => itemProps(index).defaultSize,
            };
        }
    );

    const registry = useMemo(
        () => ({
            registerItem: (ref: RefObject<HTMLDivElement | null>, itemProps: RefObject<ResizeItemProps>) => {
                items.set(ref, itemProps);
                return () => {
                    items.delete(ref);
                };
            },
            registerHandler: (ref: RefObject<HTMLDivElement | null>) => {
                handlers.add(ref);
                return () => {
                    handlers.delete(ref);
                };
            },
            notifyResizeStart: (handler: RefObject<HTMLDivElement | null>, e: PointerEvent) => foundation.onResizeStart(orderedHandlers(handlers).indexOf(handler), e),
            notifyResizing: (e: PointerEvent) => foundation.onResizing(e),
            notifyResizeEnd: (e: PointerEvent) => foundation.onResizeEnd(e),
            notifyKeyDown: (handler: RefObject<HTMLDivElement | null>, e: KeyboardEvent) => foundation.resizeByKey(orderedHandlers(handlers).indexOf(handler), e),
        }),
        [items, handlers, foundation]
    );

    const contextValue = useMemo(() => ({ direction, ...registry }), [direction, registry]);
    const mergedRef = useMergedRef(ref, groupRef);

    useDidUpdate(direction, foundation.handleDirectionChange);

    // vw and vh limits change with the window even when the group keeps its size
    useEventListener(getWindow, 'resize', () => foundation.ensureConstraint());

    useResizeObserver(groupRef, () => {
        // a group first mounted inside display:none measures 0: lay out again once it becomes measurable. #3336
        foundation.handleGroupResize();
        // a container resize without a window resize can leave px limits violated
        foundation.ensureConstraint();
    });

    return (
        <ResizeContext value={contextValue}>
            <div role={namedRole(rest)} {...rest} ref={mergedRef} className={clsx(className, prefixCls + '-group')} style={{ ...rest.style, flexDirection: direction === 'vertical' ? 'column' : 'row' }}>
                {state.isResizing && <div className={prefixCls + '-background'} style={state.backgroundStyle} />}
                {children}
            </div>
        </ResizeContext>
    );
}
