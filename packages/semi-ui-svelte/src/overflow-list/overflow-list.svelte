<script lang="ts" generics="T extends OverflowListItem = OverflowListItem">
    import { untrack } from 'svelte';
    import { isEqual } from 'es-toolkit';
    import { cssClasses } from '@fibrae/semi-foundation/overflow-list/constants';
    import OverflowListFoundation, { type ItemKeyOption, type OverflowListAdapter, type OverflowListBaseProps, type OverflowListBaseState, type OverflowListView, type VisibleLayout } from '@fibrae/semi-foundation/overflow-list/foundation';
    import '@fibrae/semi-foundation/overflow-list/overflow-list.scss';
    import { groupRole } from '../_base/group-role.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import type { OverflowListItem, OverflowListKey, OverflowListProps } from './interface.js';
    import { markScrollItem, observeSize } from './observers.js';

    type Foundation = OverflowListFoundation<OverflowListBaseProps, OverflowListBaseState>;
    type Adapter = OverflowListAdapter<OverflowListBaseProps, OverflowListBaseState>;

    const defaults = useDefaultProps('OverflowList');

    let {
        collapseFrom = defaults('collapseFrom', 'end'),
        items = defaults('items') as T[] | undefined,
        itemKey = defaults('itemKey'),
        minVisibleItems = defaults('minVisibleItems', 0),
        overflowRenderDirection = defaults('overflowRenderDirection', 'both'),
        renderMode = defaults('renderMode', 'collapse'),
        threshold = defaults('threshold', 0.75),
        wrapperClassName = defaults('wrapperClassName'),
        wrapperProps = defaults('wrapperProps'),
        wrapperStyle = defaults('wrapperStyle'),
        item,
        overflow,
        onOverflow,
        onIntersect,
        onVisibleStateChange,
        ...rest
    }: OverflowListProps<T> = $props();

    let wrapper = $state<HTMLDivElement>();

    // Bumped when a scroll item's observed element appears or changes, which the snippet output hides from reactivity
    let scrollVersion = $state(0);
    let committedKeys: OverflowListKey[] | null = null;

    const prefix = cssClasses.PREFIX;
    const isScroll = $derived(renderMode === 'scroll');

    const readItems = () => items ?? [];

    const itemList = $derived(readItems());

    const readKeyOption = () => (itemKey ?? 'key') as ItemKeyOption;

    const keyOption = $derived(readKeyOption());

    // The foundation compares styles as objects; the string is wrapped so a changed style still resets the view
    const readStyle = () => {
        return rest.style ? { css: rest.style } : undefined;
    };

    // The foundation reads the props through one object
    const foundationProps: OverflowListBaseProps = {
        get items() {
            return readItems();
        },
        get itemKey() {
            return readKeyOption();
        },
        get collapseFrom() {
            return collapseFrom;
        },
        get minVisibleItems() {
            return minVisibleItems;
        },
        get renderMode() {
            return renderMode;
        },
        get style() {
            return readStyle();
        },
    };

    const viewProps = (): OverflowListBaseProps => {
        return { items: readItems(), style: readStyle(), renderMode, collapseFrom, itemKey: readKeyOption() };
    };

    const initialView = (): OverflowListView => {
        const empty: OverflowListView = {
            items: [],
            style: undefined,
            visible: [],
            overflow: [],
            pivot: -1,
            maxCount: 0,
            overflowStatus: 'calculating',
            scrollOverflow: [[], []],
        };
        return OverflowListFoundation.resetView(viewProps(), empty, 0);
    };

    let view = $state.raw<OverflowListView>(untrack(initialView));

    // Scroll mode keeps every item rendered; the observer decides which are visible. `key` is the string
    // data-scrollkey carries.
    const scrollItems = $derived(view.visible.map((entry, index) => ({ item: entry as T, index, key: String(keyOf(entry, index)) })));
    const hidden = $derived(view.overflowStatus === 'calculating' && view.pivot < 0);

    const layoutOf = (next: OverflowListView, reversed: boolean) => {
        return OverflowListFoundation.getVisibleLayout(next, collapseFrom === 'start', reversed);
    };

    // Where the visible items sit in `items`; kept apart from the view so a later collapseFrom change is noticed
    let layout: VisibleLayout = untrack(() => layoutOf(view, collapseFrom === 'start' && renderMode !== 'scroll'));

    const { foundation, states } = useFoundation<Foundation, Adapter, OverflowListBaseProps, OverflowListBaseState>(
        OverflowListFoundation,
        foundationProps,
        () => ({ containerWidth: 0, overflowWidth: 0, visibleState: new Map() }),
        (base) => ({
            updateVisibleState: (visibleState) => base.setState({ visibleState }, () => onVisibleStateChange?.(visibleState)),
            updateView: (partial) => writeView({ ...view, ...partial }),
            notifyIntersect: (res) => onIntersect?.(res),
            notifyOverflow: (overflowItems) => onOverflow?.(overflowItems as T[]),
        })
    );

    const collapseItems = $derived(
        view.visible.map((entry, i) => {
            const index = layout.first + i * layout.step;
            return { item: entry as T, index, key: keyOf(entry, index) };
        })
    );

    const scrollOverflow = $derived(OverflowListFoundation.getOverflowItem({ items: itemList, itemKey: keyOption }, { visibleState: states().visibleState, scrollOverflow: view.scrollOverflow }) as [T[], T[]]);

    const keyOf = (entry: OverflowListItem, index: number) => {
        return OverflowListFoundation.getItemKey(keyOption, entry, index);
    };

    const writeView = (next: OverflowListView, reset = false) => {
        if (reset) {
            layout = layoutOf(next, collapseFrom === 'start' && renderMode !== 'scroll');
        } else if (next.visible !== view.visible) {
            layout = layoutOf(next, false);
        }
        view = next;
    };

    const markCalculating = () => {
        view = { ...view, overflowStatus: 'calculating' };
    };

    const onContainerResize = (entry: ResizeObserverEntry) => {
        foundation.setState({ containerWidth: entry.contentRect.width });
        markCalculating();
    };

    const onItemResize = (entry: ResizeObserverEntry, key: OverflowListKey) => {
        // not clientWidth: rounded widths of fractional items (WebKit text) can add up past the rounded container
        if (foundation.recordItemSize(key, entry.contentRect.width, view.maxCount)) {
            markCalculating();
        }
    };

    const onOverflowResize = (entry: ResizeObserverEntry) => {
        foundation.setState({ overflowWidth: entry.contentRect.width });
        markCalculating();
    };

    // Called from an attachment effect: reading the counter there would make the attachment depend on it
    const onScrollElement = () => {
        untrack(() => {
            scrollVersion += 1;
        });
    };

    // Reset the view when items, style, keys or collapseFrom change, before the DOM shows the new props
    $effect.pre(() => {
        const next = viewProps();
        // read keys here so in-place edits of a $state array are tracked
        const keys = OverflowListFoundation.getItemKeys(readItems(), readKeyOption());
        const fromStart = collapseFrom === 'start';
        untrack(() => {
            if (!isEqual(view.items, next.items) || !isEqual(view.style, next.style) || !isEqual(view.keys, keys) || layout.fromStart !== fromStart) {
                writeView(OverflowListFoundation.resetView(next, view, states().containerWidth), true);
            }
        });
    });

    // Runs after every change of the view or the measured widths. It settles: handleCollapseOverflow writes the view
    // only when leaving 'calculating'.
    $effect(() => {
        void view;
        void states().containerWidth;
        void states().overflowWidth;
        const keys = itemList.map((entry, index) => keyOf(entry, index));
        untrack(() => {
            if (committedKeys && !isEqual(committedKeys, keys)) {
                foundation.handleKeysChange(keys);
            }
            committedKeys = keys;
            if (!isScroll && view.overflowStatus === 'calculating') {
                foundation.handleCollapseOverflow();
            }
        });
    });

    // No root: visibility is judged against the viewport, which the foundation and Tabs rely on
    $effect(() => {
        void scrollVersion;
        const init = { threshold };
        if (!isScroll || !wrapper) {
            return;
        }
        const nodes = [...wrapper.children].flatMap((marker) => marker.firstElementChild ?? []);
        if (!nodes.length) {
            return;
        }
        const observer = new IntersectionObserver(foundation.handleIntersect, init);
        for (const node of nodes) {
            observer.observe(node);
        }
        return () => observer.disconnect();
    });
</script>

{#snippet overflowBox()}
    {#if overflow && view.overflow.length}
        <div {@attach observeSize(onOverflowResize)} class={`${prefix}-overflow`}>
            {@render overflow({ items: view.overflow as T[], position: collapseFrom })}
        </div>
    {/if}
{/snippet}

<div {...rest} {@attach isScroll ? undefined : observeSize(onContainerResize)} class={[prefix, rest.class]} role={groupRole(rest)} style:max-width={isScroll ? undefined : '100%'} style:visibility={isScroll ? undefined : hidden ? 'hidden' : 'visible'}>
    {#if isScroll}
        {#if overflowRenderDirection !== 'end'}
            {@render overflow?.({ items: scrollOverflow[0], position: 'start' })}
        {/if}
        {#if overflowRenderDirection === 'start'}
            {@render overflow?.({ items: scrollOverflow[1], position: 'end' })}
        {/if}
        <div bind:this={wrapper} {...wrapperProps} class={[wrapperClassName, `${prefix}-scroll-wrapper`]} style={wrapperStyle}>
            {#each scrollItems as entry (entry.key)}
                {@const key = entry.key}
                <span {@attach markScrollItem(key, onScrollElement)} style="display: contents">
                    {@render item?.({ item: entry.item, index: entry.index })}
                </span>
            {/each}
        </div>
        {#if overflowRenderDirection === 'end'}
            {@render overflow?.({ items: scrollOverflow[0], position: 'start' })}
        {/if}
        {#if overflowRenderDirection !== 'start'}
            {@render overflow?.({ items: scrollOverflow[1], position: 'end' })}
        {/if}
    {:else}
        {#if collapseFrom === 'start'}
            {@render overflowBox()}
        {/if}
        {#each collapseItems as entry (entry.key ?? entry.index)}
            {@const key = entry.key}
            <div {@attach observeSize((box) => onItemResize(box, key))} class={`${prefix}-item`}>
                {@render item?.({ item: entry.item, index: entry.index })}
            </div>
        {/each}
        {#if collapseFrom === 'end'}
            {@render overflowBox()}
        {/if}
    {/if}
</div>
