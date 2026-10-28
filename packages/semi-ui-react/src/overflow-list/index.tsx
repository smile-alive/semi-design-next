import type React from 'react';
import { cloneElement, isValidElement, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses, strings } from '@fibrae/semi-foundation/overflow-list/constants';
import OverflowListFoundation, { type OverflowListAdapter, type OverflowListView, type VisibleLayout } from '@fibrae/semi-foundation/overflow-list/foundation';
import { isHTMLElement } from '@fibrae/semi-foundation/utils/dom';
import '@fibrae/semi-foundation/overflow-list/overflow-list.scss';
import type { ElementProps } from '../_base/base';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useIntersectionObserver from '../_base/use-intersection-observer';
import { hasContent } from '../_utils';
import { mergeRefs } from '../_utils/merge-refs';
import ReactResizeObserver, { type ResizeEntry } from '../resize-observer';

const prefixCls = cssClasses.PREFIX;
const Boundary = strings.BOUNDARY_MAP;
const RenderMode = strings.MODE_MAP;

export type OverflowItem = Record<string, any>;

type Key = string | number;

interface OverflowListCommonProps<T> extends ElementProps<'div', 'children'> {
    className?: string;
    collapseFrom?: 'start' | 'end';
    items?: Array<T>;
    minVisibleItems?: number;
    onIntersect?: (res: { [key: string]: IntersectionObserverEntry }) => void;
    onOverflow?: (overflowItems: Array<T>) => void;
    style?: CSSProperties;
    threshold?: number;
    visibleItemRenderer?: (item: T, index: number) => ReactElement;
    wrapperClassName?: string;
    wrapperStyle?: CSSProperties;
    /** Attributes of the scroll-mode wrapper holding the visible items */
    wrapperProps?: HTMLAttributes<HTMLDivElement>;
    itemKey?: Key | ((item: T) => Key);
    onVisibleStateChange?: (visibleState: Map<string, boolean>) => void;
    overflowRenderDirection?: 'both' | 'start' | 'end'; // used in tabs, not exposed to user
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

interface OverflowListCollapseProps<T> extends OverflowListCommonProps<T> {
    renderMode?: 'collapse';
    /** Renders the items that do not fit */
    overflowRenderer?: (overflowItems: Array<T>) => ReactNode;
}

interface OverflowListScrollProps<T> extends OverflowListCommonProps<T> {
    renderMode: 'scroll';
    /** Renders the items scrolled out before and after the visible ones */
    overflowRenderer?: (overflowItems: [Array<T>, Array<T>]) => [ReactNode, ReactNode];
}

export type OverflowListProps<T = OverflowItem> = OverflowListCollapseProps<T> | OverflowListScrollProps<T>;

/** Measured widths and scroll-mode visibility */
export interface OverflowListState {
    containerWidth: number;
    overflowWidth: number;
    visibleState: Map<string, boolean>;
}

const defaultProps = {
    collapseFrom: 'end',
    items: [],
    minVisibleItems: 0,
    overflowRenderer: (): ReactElement => null,
    renderMode: 'collapse',
    threshold: 0.75,
    visibleItemRenderer: (): ReactElement => null,
    onOverflow: () => null,
    overflowRenderDirection: 'both',
} satisfies Partial<OverflowListProps>;

type ListView = OverflowListView & VisibleLayout;

const withLayout = (view: OverflowListView, fromStart: boolean, measuring: boolean): ListView => ({ ...view, ...OverflowListFoundation.getVisibleLayout(view, fromStart, fromStart && measuring) });

const emptyView: OverflowListView = {
    items: [],
    style: undefined,
    visible: [],
    overflow: [],
    pivot: -1,
    maxCount: 0,
    overflowStatus: 'calculating',
    scrollOverflow: [[], []],
};

// reference to https://github.com/palantir/blueprint/blob/1aa71605/packages/core/src/components/overflow-list/overflowList.tsx#L34
// the overload carries the item type to callers; the foundation reads items as plain records
export default function OverflowList<T = OverflowItem>(rawProps: OverflowListProps<T>): ReactElement;
export default function OverflowList(rawProps: OverflowListProps) {
    const props = useDefaultProps('OverflowList', rawProps, defaultProps);
    const { ref, className, collapseFrom, items, minVisibleItems, onIntersect, onOverflow, overflowRenderer, renderMode, style, threshold, visibleItemRenderer, wrapperClassName, wrapperStyle, wrapperProps, itemKey, onVisibleStateChange, overflowRenderDirection, ...rest } = props;

    const [itemNodes] = useState(() => new Map<Key, Element>());
    const committedKeys = useRef<Array<Key>>(null);

    const isScroll = renderMode === RenderMode.SCROLL;
    const rootRole = namedRole(rest);
    const keys = OverflowListFoundation.getItemKeys(items, itemKey);

    const resetView = (view: OverflowListView, containerWidth: number) => withLayout(OverflowListFoundation.resetView(props, view, containerWidth), props.collapseFrom === Boundary.START, props.renderMode !== RenderMode.SCROLL);

    const [storedView, setView] = useState(() => resetView(emptyView, 0));
    let view = storedView;

    const [foundation, state] = useFoundation<OverflowListFoundation<OverflowListProps, OverflowListState>, OverflowListAdapter<OverflowListProps, OverflowListState>, OverflowListProps, OverflowListState>(
        OverflowListFoundation,
        props,
        () => ({ containerWidth: 0, overflowWidth: 0, visibleState: new Map() }),
        (base) => ({
            updateVisibleState: (visibleState) => base.setState({ visibleState }, () => base.getProps().onVisibleStateChange?.(visibleState)),
            updateView: (viewState) =>
                setView((prev) => {
                    const next = { ...prev, ...viewState };
                    return viewState.visible ? withLayout(next, base.getProps().collapseFrom === Boundary.START, false) : next;
                }),
            notifyIntersect: (res) => base.getProps().onIntersect?.(res),
            notifyOverflow: (overflow) => base.getProps().onOverflow(overflow),
        })
    );

    if (!isEqual(view.items, items) || !isEqual(view.style, style) || !isEqual(view.keys, keys) || view.fromStart !== (collapseFrom === Boundary.START)) {
        view = resetView(view, state.containerWidth);
        setView(view);
    }

    // keyed by the item key, not the element's key: the foundation looks visibility up by the former
    const renderedItems = isScroll
        ? view.visible.flatMap((item, idx) => {
              const element = visibleItemRenderer(item, idx);
              return isValidElement(element) ? [{ element, key: String(OverflowListFoundation.getItemKey(itemKey, item, idx)) }] : [];
          })
        : [];

    const scrollKeys = isScroll ? JSON.stringify(renderedItems.map(({ key }) => key)) : null;

    const listStyle: CSSProperties = {
        ...style,
        ...(renderMode === RenderMode.COLLAPSE
            ? {
                  maxWidth: '100%',
                  visibility: view.overflowStatus === 'calculating' && view.pivot < 0 ? 'hidden' : 'visible',
              }
            : null),
    };

    const markCalculating = () => setView((prev) => ({ ...prev, overflowStatus: 'calculating' }));

    const handleItemResize = (entry: ResizeEntry, key: Key) => {
        // not clientWidth: rounded widths of fractional items (WebKit text) can add up past the rounded container
        if (foundation.recordItemSize(key, entry.contentRect.width, view.maxCount)) {
            markCalculating();
        }
    };

    // measure in the layout phase, before the hidden list is painted
    useLayoutEffect(() => {
        if (committedKeys.current && !isEqual(committedKeys.current, keys)) {
            foundation.handleKeysChange(keys);
        }
        committedKeys.current = keys;
        if (!isScroll && view.overflowStatus === 'calculating') {
            foundation.handleCollapseOverflow();
        }
    });

    // no root: the foundation and Tabs rely on viewport visibility to tell a list scrolled out of the page from one
    // whose items are all hidden
    useIntersectionObserver(
        () => (scrollKeys === null ? [] : [...itemNodes.values()].filter(isHTMLElement)),
        (entries) => foundation.handleIntersect(entries),
        { threshold },
        scrollKeys
    );

    // narrowed on props: the destructured renderer does not follow the renderMode check
    if (props.renderMode === RenderMode.SCROLL) {
        const scrollWrapper = (
            <div {...wrapperProps} className={clsx(wrapperClassName, `${prefixCls}-scroll-wrapper`)} style={wrapperStyle}>
                {renderedItems.map(({ element, key }) => {
                    return cloneElement(element as ReactElement<any>, {
                        // cloneElement replaces the ref, so keep the one the renderer put on its element
                        ref: mergeRefs<Element>([
                            (node) => {
                                itemNodes.set(key, node);
                                return () => {
                                    itemNodes.delete(key);
                                };
                            },
                            (element.props as { ref?: React.Ref<Element> }).ref,
                        ]),
                        'data-scrollkey': key,
                        key,
                    });
                })}
            </div>
        );
        // the shared default overflowRenderer returns null, which means "render nothing at either end"
        const [start, end] =
            props.overflowRenderer(
                OverflowListFoundation.getOverflowItem(props, {
                    visibleState: state.visibleState,
                    scrollOverflow: view.scrollOverflow,
                })
            ) ?? [];
        const children = overflowRenderDirection === 'both' ? [start, scrollWrapper, end] : overflowRenderDirection === 'start' ? [start, end, scrollWrapper] : [scrollWrapper, start, end];
        return (
            <div role={rootRole} {...rest} ref={ref} className={clsx(prefixCls, className)} style={listStyle}>
                {children[0]}
                {children[1]}
                {children[2]}
            </div>
        );
    }

    let overflowNode = props.overflowRenderer(view.overflow);

    if (Array.isArray(overflowNode)) {
        overflowNode = <>{overflowNode}</>;
    }

    if (hasContent(overflowNode)) {
        overflowNode = (
            <ReactResizeObserver
                onResize={([entry]) => {
                    foundation.setState({ overflowWidth: entry.contentRect.width });
                    markCalculating();
                }}
            >
                <div className={`${prefixCls}-overflow`}>{overflowNode}</div>
            </ReactResizeObserver>
        );
    }

    return (
        <ReactResizeObserver
            onResize={(entries) => {
                foundation.setState({ containerWidth: entries[0]?.contentRect.width });
                markCalculating();
            }}
        >
            <div role={rootRole} {...rest} ref={ref} className={clsx(prefixCls, className)} style={listStyle}>
                {collapseFrom === Boundary.START && overflowNode}
                {view.visible.map((item, i) => {
                    const idx = view.first + view.step * i;
                    const key = OverflowListFoundation.getItemKey(itemKey, item, idx);
                    return (
                        <ReactResizeObserver key={key ?? idx} onResize={([entry]) => handleItemResize(entry, key)}>
                            {/* the wrapper div gives the item width without adding up padding, margin and border */}
                            <div className={`${prefixCls}-item`}>{visibleItemRenderer(item, idx)}</div>
                        </ReactResizeObserver>
                    );
                })}
                {collapseFrom === Boundary.END && overflowNode}
            </div>
        </ReactResizeObserver>
    );
}
