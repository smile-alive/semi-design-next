import type React from 'react';
import { cloneElement, isValidElement, useLayoutEffect, useState, type CSSProperties, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import clsx from 'clsx';
import { cssClasses, SCROLL_KEY_ATTRIBUTE, strings } from '@fibrae/semi-foundation/components/overflow-list/constants';
import OverflowListFoundation, { type OverflowListAdapter, type OverflowListBaseState } from '@fibrae/semi-foundation/components/overflow-list/foundation';
import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
import { isHTMLElement } from '@fibrae/semi-foundation/utils/dom';
import '@fibrae/semi-foundation/components/overflow-list/overflow-list.scss';
import type { ElementProps } from '../../base/base';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import useIntersectionObserver from '../../hooks/use-intersection-observer';
import ReactResizeObserver, { type ResizeEntry } from '../../internal/resize-observer';
import { hasContent } from '../../utils';
import { mergeRefs } from '../../utils/merge-refs';

type Foundation = OverflowListFoundation<OverflowListProps>;
type Adapter = OverflowListAdapter<OverflowListProps>;

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
    wrapperProps?: HTMLAttributes<HTMLDivElement>;
    itemKey?: Key | ((item: T) => Key);
    onVisibleStateChange?: (visibleState: Map<string, boolean>) => void;
    /** Attached to the root div */
    ref?: React.Ref<HTMLDivElement>;
}

interface OverflowListCollapseProps<T> extends OverflowListCommonProps<T> {
    renderMode?: 'collapse';
    overflowRenderer?: (overflowItems: Array<T>) => ReactNode;
}

interface OverflowListScrollProps<T> extends OverflowListCommonProps<T> {
    renderMode: 'scroll';
    overflowRenderer?: (overflowItems: [Array<T>, Array<T>]) => [ReactNode, ReactNode];
}

export type OverflowListProps<T = OverflowItem> = OverflowListCollapseProps<T> | OverflowListScrollProps<T>;

/** Props Semi's own components pass, kept out of the public OverflowListProps */
export type OverflowListInternalProps<T = OverflowItem> = OverflowListProps<T> & {
    /** Tabs' arrowPosition: where scroll mode puts the two overflow nodes */
    overflowRenderDirection?: 'both' | 'start' | 'end';
};

export type { OverflowListBaseState as OverflowListState };

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
} satisfies Partial<OverflowListInternalProps>;

// reference to https://github.com/palantir/blueprint/blob/1aa71605/packages/core/src/components/overflow-list/overflowList.tsx#L34
// the overload carries the item type to callers; the foundation reads items as plain records
export default function OverflowList<T = OverflowItem>(rawProps: OverflowListProps<T>): ReactElement;
export default function OverflowList(rawProps: OverflowListProps) {
    const props = useDefaultProps('OverflowList', rawProps as OverflowListInternalProps, defaultProps);
    const { ref, className, collapseFrom, items, minVisibleItems, onIntersect, onOverflow, overflowRenderer, renderMode, style, threshold, visibleItemRenderer, wrapperClassName, wrapperStyle, wrapperProps, itemKey, onVisibleStateChange, overflowRenderDirection, ...rest } = props;

    // not a ref: the item ref callbacks go through mergeRefs during render, where the Compiler rejects ref access
    const [itemNodes] = useState(() => new Map<Key, Element>());
    const [storedView, setView] = useState(() => OverflowListFoundation.createView(props));

    const [foundation, state] = useFoundation<Foundation, Adapter, OverflowListProps, OverflowListBaseState>(
        OverflowListFoundation,
        props,
        () => OverflowListFoundation.getInitialState(),
        (base) => ({
            notifyVisibleStateChange: (visibleState) => base.getProps().onVisibleStateChange?.(visibleState),
            updateView: setView,
            notifyIntersect: (res) => base.getProps().onIntersect?.(res),
            notifyOverflow: (overflow) => base.getProps().onOverflow(overflow),
        })
    );

    const isScroll = renderMode === RenderMode.SCROLL;
    const rootRole = namedRole(rest);
    const view = OverflowListFoundation.syncView(props, storedView, state.containerWidth);

    if (view !== storedView) {
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
                  visibility: OverflowListFoundation.isHidden(view) ? 'hidden' : 'visible',
              }
            : null),
    };

    // not clientWidth: rounded widths of fractional items (WebKit text) can add up past the rounded container
    const handleItemResize = (entry: ResizeEntry, key: Key) => foundation.handleItemResize(key, entry.contentRect.width, view.maxCount);

    // measure in the layout phase, before the hidden list is painted
    useLayoutEffect(() => {
        foundation.handleCommit(view);
    });

    // no root: the foundation and Tabs rely on viewport visibility to tell a list scrolled out of the page from one
    // whose items are all hidden
    useIntersectionObserver(() => (scrollKeys === null ? [] : [...itemNodes.values()].filter(isHTMLElement)), foundation.handleIntersect, { threshold }, scrollKeys);

    // narrowed on props: the destructured renderer does not follow the renderMode check
    if (props.renderMode === RenderMode.SCROLL) {
        const scrollWrapper = (
            <div {...wrapperProps} className={clsx(wrapperClassName, cssClasses.SCROLL_WRAPPER)} style={wrapperStyle}>
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
                        [SCROLL_KEY_ATTRIBUTE]: key,
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
            <ReactResizeObserver onResize={([entry]) => foundation.handleOverflowResize(entry.contentRect.width)}>
                <div className={`${prefixCls}-overflow`}>{overflowNode}</div>
            </ReactResizeObserver>
        );
    }

    return (
        <ReactResizeObserver onResize={([entry]) => foundation.handleContainerResize(entry.contentRect.width)}>
            <div role={rootRole} {...rest} ref={ref} className={clsx(prefixCls, className)} style={listStyle}>
                {collapseFrom === Boundary.START && overflowNode}
                {OverflowListFoundation.getVisibleItems(view, itemKey).map(({ item, index, key }) => (
                    <ReactResizeObserver key={key ?? index} onResize={([entry]) => handleItemResize(entry, key)}>
                        {/* the wrapper div gives the item width without adding up padding, margin and border */}
                        <div className={`${prefixCls}-item`}>{visibleItemRenderer(item, index)}</div>
                    </ReactResizeObserver>
                ))}
                {collapseFrom === Boundary.END && overflowNode}
            </div>
        </ReactResizeObserver>
    );
}
