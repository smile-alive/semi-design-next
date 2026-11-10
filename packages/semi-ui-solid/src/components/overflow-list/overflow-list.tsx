import { type Accessor, type JSX, type ResolvedChildren, For, Show, children, createComputed, createEffect, createMemo, createSignal, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { cssClasses } from '@fibrae/semi-foundation/components/overflow-list/constants';
import OverflowListFoundation, { type ItemKeyOption, type OverflowListAdapter, type OverflowListBaseProps, type OverflowListBaseState } from '@fibrae/semi-foundation/components/overflow-list/foundation';
import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
import '@fibrae/semi-foundation/components/overflow-list/overflow-list.scss';
import type { ElementProps } from '../../base/element-props';
import useDefaultProps from '../../base/use-default-props';
import useFoundation from '../../base/use-foundation';
import useIntersectionObserver from '../../primitives/use-intersection-observer';
import useResizeObserver from '../../primitives/use-resize-observer';
import hasContent from '../../utils/has-content';
import mergeRefs from '../../utils/merge-refs';
import MeasuredBox from './measured-box';
import ScrollItem from './scroll-item';

const prefixCls = cssClasses.PREFIX;

export type OverflowItem = Record<string, any>;

type Key = string | number;

interface OverflowListCommonProps<T> extends ElementProps<'div', 'children'> {
    collapseFrom?: 'start' | 'end';
    items?: Array<T>;
    minVisibleItems?: number;
    onIntersect?: (res: { [key: string]: IntersectionObserverEntry }) => void;
    onOverflow?: (overflowItems: Array<T>) => void;
    threshold?: number;
    /** Scroll mode: the element it returns is observed, so it must be an element rather than text */
    visibleItemRenderer?: (item: T, index: number) => JSX.Element;
    wrapperClassName?: string;
    wrapperStyle?: JSX.CSSProperties | string;
    /** Attributes of the scroll-mode wrapper holding the visible items */
    wrapperProps?: JSX.HTMLAttributes<HTMLDivElement>;
    itemKey?: Key | ((item: T) => Key);
    onVisibleStateChange?: (visibleState: Map<string, boolean>) => void;
    overflowRenderDirection?: 'both' | 'start' | 'end'; // used in tabs, not exposed to user
}

interface OverflowListCollapseProps<T> extends OverflowListCommonProps<T> {
    renderMode?: 'collapse';
    /** Renders the items that do not fit */
    overflowRenderer?: (overflowItems: Array<T>) => JSX.Element;
}

interface OverflowListScrollProps<T> extends OverflowListCommonProps<T> {
    renderMode: 'scroll';
    /** Renders the items scrolled out before and after the visible ones */
    overflowRenderer?: (overflowItems: [Array<T>, Array<T>]) => [JSX.Element, JSX.Element];
}

export type OverflowListProps<T = OverflowItem> = OverflowListCollapseProps<T> | OverflowListScrollProps<T>;

/** The two renderer signatures share one body, so the body reads the union through this loose form */
type InternalProps = OverflowListCommonProps<OverflowItem> & {
    renderMode?: 'collapse' | 'scroll';
    overflowRenderer?: (overflowItems: any) => any;
};

const defaultProps = {
    collapseFrom: 'end',
    items: [],
    minVisibleItems: 0,
    overflowRenderer: () => null,
    renderMode: 'collapse',
    threshold: 0.75,
    visibleItemRenderer: () => null,
    overflowRenderDirection: 'both',
} satisfies Partial<OverflowListProps>;

const shallowEqual = (a: readonly unknown[], b: readonly unknown[]) => a.length === b.length && a.every((value, index) => value === b[index]);

const toDeclarations = (style: Record<string, string | undefined>) =>
    Object.entries(style)
        .map(([name, value]) => `${name}: ${value}`)
        .join('; ');

function OverflowBox(props: { content: Accessor<ResolvedChildren>; onResize: (entry: ResizeObserverEntry) => void }) {
    return (
        <Show when={hasContent(props.content())}>
            <MeasuredBox class={`${prefixCls}-overflow`} onResize={props.onResize}>
                {props.content()}
            </MeasuredBox>
        </Show>
    );
}

interface Entry {
    item: OverflowItem;
    index: number;
}

type Foundation = OverflowListFoundation<OverflowListBaseProps>;
type Adapter = OverflowListAdapter<OverflowListBaseProps>;

// reference to https://github.com/palantir/blueprint/blob/1aa71605/packages/core/src/components/overflow-list/overflowList.tsx#L34
export default function OverflowList<T = OverflowItem>(rawProps: OverflowListProps<T>) {
    const props = useDefaultProps('OverflowList', rawProps as InternalProps, defaultProps);

    const [local, rest] = splitProps(props, [
        'collapseFrom',
        'items',
        'itemKey',
        'minVisibleItems',
        'onIntersect',
        'onOverflow',
        'onVisibleStateChange',
        'overflowRenderDirection',
        'overflowRenderer',
        'ref',
        'renderMode',
        'class',
        'style',
        'threshold',
        'visibleItemRenderer',
        'wrapperClassName',
        'wrapperProps',
        'wrapperStyle',
    ]);

    const [root, setRoot] = createSignal<HTMLDivElement>();

    // initial value only: a later change of items, style, keys or collapseFrom is reset by the computation below
    const [view, setView] = createSignal(OverflowListFoundation.createView(props as OverflowListBaseProps));
    const [scrollNodes, setScrollNodes] = createSignal(new Map<string, Element>(), { equals: false });

    const { foundation, state } = useFoundation<Foundation, Adapter, OverflowListBaseProps, OverflowListBaseState>(
        OverflowListFoundation,
        props as OverflowListBaseProps,
        () => OverflowListFoundation.getInitialState(),
        () => ({
            notifyVisibleStateChange: (visibleState) => props.onVisibleStateChange?.(visibleState),
            updateView: (update) => setView(update),
            notifyIntersect: (res) => props.onIntersect?.(res),
            notifyOverflow: (overflow) => props.onOverflow?.(overflow),
        })
    );

    const overflowItems = createMemo(() => view().overflow, [], { equals: shallowEqual });
    const isScroll = createMemo(() => props.renderMode === 'scroll');
    const threshold = createMemo(() => props.threshold);
    const items = createMemo(() => props.items);
    const overflowRenderer = createMemo(() => local.overflowRenderer);
    const overflowRenderDirection = createMemo(() => local.overflowRenderDirection);
    const visibleItemRenderer = createMemo(() => local.visibleItemRenderer);

    // the foundation falls back to the `key` field when itemKey is unset, but types the option as required
    const itemKey = createMemo(() => props.itemKey as ItemKeyOption);

    // Keyed by item key so a measured box keeps its element, and with it its observer, while the list settles
    const entries = createMemo(() => new Map(OverflowListFoundation.getVisibleItems(view(), itemKey()).map(({ key, item, index }) => [key, { item, index }] as const)));
    const visibleKeys = createMemo(() => [...entries().keys()], [], { equals: shallowEqual });

    const scrollSides = createMemo((): [JSX.Element, JSX.Element] => {
        if (!isScroll()) {
            return [undefined, undefined];
        }
        // a direction change moves the sides to other inserts, and the insert a node leaves removes it even after
        // another one took it; render them afresh instead (React remounts them in their new positions too)
        overflowRenderDirection();
        const [start, end] = overflowRenderer()(OverflowListFoundation.getOverflowItem({ items: items(), itemKey: itemKey() }, { visibleState: state().visibleState, scrollOverflow: view().scrollOverflow })) ?? [];
        return [start, end];
    });

    const collapseOverflow = children(() => (isScroll() ? undefined : overflowRenderer()(overflowItems())));
    const scrollTargets = createMemo(() => (isScroll() ? visibleKeys().flatMap((key) => scrollNodes().get(String(key)) ?? []) : []), [], { equals: shallowEqual });

    const rootStyle = () => {
        const own = local.style;
        if (isScroll()) {
            return own;
        }
        const internal = { 'max-width': '100%', visibility: OverflowListFoundation.isHidden(view()) ? 'hidden' : 'visible' };
        return typeof own === 'string' ? [own, toDeclarations(internal)].join('; ') : ({ ...own, ...internal } as JSX.CSSProperties);
    };

    // A row outlives its key for one update, so it keeps the last entry; the equality check stops a rebuilt entry object from re-running the renderer
    const entryOf = (key: Key) => createMemo<Entry>((previous) => entries().get(key) ?? previous, undefined as unknown as Entry, { equals: (a, b) => a.item === b.item && a.index === b.index });

    // not clientWidth: rounded widths of fractional items (WebKit text) can add up past the rounded container
    const handleItemResize = (entry: ResizeObserverEntry, key: Key) => foundation.handleItemResize(key, entry.contentRect.width, view().maxCount);

    const handleOverflowResize = (entry: ResizeObserverEntry) => foundation.handleOverflowResize(entry.contentRect.width);

    const registerScrollNode = (key: string, node: Element) => {
        setScrollNodes((nodes) => nodes.set(key, node));
        return () => setScrollNodes((nodes) => (nodes.get(key) === node ? (nodes.delete(key), nodes) : nodes));
    };

    // Runs before the DOM updates, so the reset lands in the same update as the props
    createComputed(() => {
        setView(
            OverflowListFoundation.syncView(
                props as OverflowListBaseProps,
                untrack(view),
                untrack(() => state().containerWidth)
            )
        );
    });

    // a change of the item keys always resets the view, so tracking the view is enough
    createEffect(() => {
        const current = view();
        untrack(() => foundation.handleCommit(current));
    });

    useResizeObserver(
        () => (isScroll() ? undefined : root()),
        ([entry]) => foundation.handleContainerResize(entry.contentRect.width)
    );

    // no root: the foundation and Tabs rely on viewport visibility to tell a list scrolled out of the page from one
    // whose items are all hidden
    useIntersectionObserver(scrollTargets, foundation.handleIntersect, () => ({ threshold: threshold() }));

    return (
        <div {...rest} role={namedRole(rest)} ref={mergeRefs(local.ref, (node: HTMLDivElement) => setRoot(node))} class={clsx(prefixCls, local.class)} style={rootStyle()}>
            <Show when={!isScroll()}>
                <Show when={local.collapseFrom === 'start'}>
                    <OverflowBox content={collapseOverflow} onResize={handleOverflowResize} />
                </Show>
                <For each={visibleKeys()}>
                    {(key) => {
                        const entry = entryOf(key);
                        return (
                            <MeasuredBox class={`${prefixCls}-item`} onResize={(resized) => handleItemResize(resized, key)}>
                                {visibleItemRenderer()(entry().item, entry().index)}
                            </MeasuredBox>
                        );
                    }}
                </For>
                <Show when={local.collapseFrom === 'end'}>
                    <OverflowBox content={collapseOverflow} onResize={handleOverflowResize} />
                </Show>
            </Show>
            {/* each scroll part is its own insert: in one array, reconcileArrays replaces the wrapper while both sides change, which detaches it and resets its scroll position */}
            <Show when={isScroll() && local.overflowRenderDirection !== 'end'}>{scrollSides()[0]}</Show>
            <Show when={isScroll() && local.overflowRenderDirection === 'start'}>{scrollSides()[1]}</Show>
            <Show when={isScroll()}>
                <div {...local.wrapperProps} class={clsx(local.wrapperClassName, cssClasses.SCROLL_WRAPPER)} style={local.wrapperStyle}>
                    <For each={visibleKeys()}>{(key) => <ScrollItem scrollKey={String(key)} entry={entryOf(key)} render={visibleItemRenderer()} register={(node) => registerScrollNode(String(key), node)} />}</For>
                </div>
            </Show>
            <Show when={isScroll() && local.overflowRenderDirection === 'end'}>{scrollSides()[0]}</Show>
            <Show when={isScroll() && local.overflowRenderDirection !== 'start'}>{scrollSides()[1]}</Show>
        </div>
    );
}
