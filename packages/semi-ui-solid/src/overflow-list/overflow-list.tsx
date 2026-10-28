import { type Accessor, type JSX, type ResolvedChildren, For, Show, children, createComputed, createEffect, createMemo, createSignal, on, splitProps, untrack } from 'solid-js';
import clsx from 'clsx';
import { isEqual } from 'es-toolkit';
import { cssClasses } from '@fibrae/semi-foundation/overflow-list/constants';
import OverflowListFoundation, { type ItemKeyOption, type OverflowListAdapter, type OverflowListBaseProps, type OverflowListBaseState, type OverflowListView, type VisibleLayout } from '@fibrae/semi-foundation/overflow-list/foundation';
import '@fibrae/semi-foundation/overflow-list/overflow-list.scss';
import type { ElementProps } from '../_base/element-props';
import hasContent from '../_base/has-content';
import mergeRefs from '../_base/merge-refs';
import { namedRole } from '../_base/named-role';
import useDefaultProps from '../_base/use-default-props';
import useFoundation from '../_base/use-foundation';
import useIntersectionObserver from '../_base/use-intersection-observer';
import useResizeObserver from '../_base/use-resize-observer';
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

type ListView = OverflowListView & VisibleLayout;

const withLayout = (view: OverflowListView, fromStart: boolean, measuring: boolean): ListView => ({ ...view, ...OverflowListFoundation.getVisibleLayout(view, fromStart, fromStart && measuring) });

const resetView = (props: OverflowListBaseProps, view: OverflowListView, containerWidth: number) => withLayout(OverflowListFoundation.resetView(props, view, containerWidth), props.collapseFrom === 'start', props.renderMode !== 'scroll');

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

type Foundation = OverflowListFoundation<OverflowListBaseProps, OverflowListBaseState>;
type Adapter = OverflowListAdapter<OverflowListBaseProps, OverflowListBaseState>;

// reference to https://github.com/palantir/blueprint/blob/1aa71605/packages/core/src/components/overflow-list/overflowList.tsx#L34
export default function OverflowList<T = OverflowItem>(rawProps: OverflowListProps<T>) {
    const props = useDefaultProps('OverflowList', rawProps as unknown as InternalProps, defaultProps);

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
    const [view, setView] = createSignal(resetView(props as OverflowListBaseProps, emptyView, 0));
    const [scrollNodes, setScrollNodes] = createSignal(new Map<string, Element>(), { equals: false });

    const { foundation, state } = useFoundation<Foundation, Adapter, OverflowListBaseProps, OverflowListBaseState>(
        OverflowListFoundation,
        props as OverflowListBaseProps,
        () => ({ containerWidth: 0, overflowWidth: 0, visibleState: new Map() }),
        (base) => ({
            updateVisibleState: (visibleState) => base.setState({ visibleState }, () => props.onVisibleStateChange?.(visibleState)),
            updateView: (viewState) =>
                setView((prev) => {
                    const next = { ...prev, ...viewState };
                    return viewState.visible ? withLayout(next, props.collapseFrom === 'start', false) : next;
                }),
            notifyIntersect: (res) => props.onIntersect?.(res),
            notifyOverflow: (overflow) => props.onOverflow?.(overflow),
        })
    );

    const overflowItems = createMemo(() => view().overflow, [], { equals: shallowEqual });
    const isScroll = createMemo(() => props.renderMode === 'scroll');
    const threshold = createMemo(() => props.threshold);

    // renderers create new elements on every call, so they run again only when their own inputs change
    const items = createMemo(() => props.items);
    const overflowRenderer = createMemo(() => local.overflowRenderer);
    const overflowRenderDirection = createMemo(() => local.overflowRenderDirection);
    const visibleItemRenderer = createMemo(() => local.visibleItemRenderer);

    // the foundation falls back to the `key` field when itemKey is unset, but types the option as required
    const itemKey = createMemo(() => props.itemKey as ItemKeyOption);
    const keys = createMemo(() => OverflowListFoundation.getItemKeys(items(), itemKey()), undefined, { equals: isEqual });

    // Keyed by item key so a measured box keeps its element, and with it its observer, while the list settles
    const entries = createMemo(() => {
        const { visible, first, step } = view();
        return new Map(visible.map((item, i) => [OverflowListFoundation.getItemKey(itemKey(), item, first + step * i), { item, index: first + step * i }] as const));
    });

    const visibleKeys = createMemo(() => [...entries().keys()], [], { equals: shallowEqual });

    // the shared default overflowRenderer returns null, which means "render nothing at either end"
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
        const internal = { 'max-width': '100%', visibility: view().overflowStatus === 'calculating' && view().pivot < 0 ? 'hidden' : 'visible' };
        return typeof own === 'string' ? [own, toDeclarations(internal)].join('; ') : ({ ...own, ...internal } as JSX.CSSProperties);
    };

    // A row outlives its key for one update, so it keeps the last entry; the equality check stops a rebuilt entry object from re-running the renderer
    const entryOf = (key: Key) => createMemo<Entry>((previous) => entries().get(key) ?? previous, undefined as unknown as Entry, { equals: (a, b) => a.item === b.item && a.index === b.index });

    const markCalculating = () => setView((prev) => ({ ...prev, overflowStatus: 'calculating' }));

    const handleItemResize = (entry: ResizeObserverEntry, key: Key) => {
        // not clientWidth: rounded widths of fractional items (WebKit text) can add up past the rounded container
        if (foundation.recordItemSize(key, entry.contentRect.width, view().maxCount)) {
            markCalculating();
        }
    };

    const handleOverflowResize = (entry: ResizeObserverEntry) => {
        foundation.setState({ overflowWidth: entry.contentRect.width });
        markCalculating();
    };

    const registerScrollNode = (key: string, node: Element) => {
        setScrollNodes((nodes) => nodes.set(key, node));
        return () => setScrollNodes((nodes) => (nodes.get(key) === node ? (nodes.delete(key), nodes) : nodes));
    };

    // Runs before the DOM updates, so the reset lands in the same update as the props
    createComputed(() => {
        const current = untrack(view);
        if (!isEqual(current.items, props.items) || !isEqual(current.style, props.style) || !isEqual(current.keys, keys()) || current.fromStart !== (props.collapseFrom === 'start')) {
            setView(
                resetView(
                    props as OverflowListBaseProps,
                    current,
                    untrack(() => state().containerWidth)
                )
            );
        }
    });

    createEffect(on(keys, (current) => foundation.handleKeysChange(current), { defer: true }));

    createEffect(() => {
        if (!isScroll() && view().overflowStatus === 'calculating') {
            untrack(() => foundation.handleCollapseOverflow());
        }
    });

    useResizeObserver(
        () => (isScroll() ? undefined : root()),
        (resized) => {
            foundation.setState({ containerWidth: resized[0]?.contentRect.width });
            markCalculating();
        }
    );

    // no root: the foundation and Tabs rely on viewport visibility to tell a list scrolled out of the page from one
    // whose items are all hidden
    useIntersectionObserver(
        scrollTargets,
        (observed) => foundation.handleIntersect(observed),
        () => ({ threshold: threshold() })
    );

    return (
        <div {...rest} role={namedRole(rest.role, rest['aria-label'], rest['aria-labelledby']) as JSX.HTMLAttributes<HTMLDivElement>['role']} ref={mergeRefs(local.ref, (node: HTMLDivElement) => setRoot(node))} class={clsx(prefixCls, local.class)} style={rootStyle()}>
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
                <div {...local.wrapperProps} class={clsx(local.wrapperClassName, `${prefixCls}-scroll-wrapper`)} style={local.wrapperStyle}>
                    <For each={visibleKeys()}>{(key) => <ScrollItem scrollKey={String(key)} entry={entryOf(key)} render={visibleItemRenderer()} register={(node) => registerScrollNode(String(key), node)} />}</For>
                </div>
            </Show>
            <Show when={isScroll() && local.overflowRenderDirection === 'end'}>{scrollSides()[0]}</Show>
            <Show when={isScroll() && local.overflowRenderDirection !== 'start'}>{scrollSides()[1]}</Show>
        </div>
    );
}
