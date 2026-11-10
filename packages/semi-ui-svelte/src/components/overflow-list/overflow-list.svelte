<script lang="ts" generics="T extends OverflowListItem = OverflowListItem">
    import { untrack } from 'svelte';
    import { cssClasses } from '@fibrae/semi-foundation/components/overflow-list/constants';
    import OverflowListFoundation, { type ItemKeyOption, type OverflowListAdapter, type OverflowListBaseProps, type OverflowListBaseState, type OverflowListView } from '@fibrae/semi-foundation/components/overflow-list/foundation';
    import { namedRole } from '@fibrae/semi-foundation/utils/a11y';
    import '@fibrae/semi-foundation/components/overflow-list/overflow-list.scss';
    import useDefaultProps from '../../base/use-default-props.js';
    import useFoundation from '../../base/use-foundation.svelte.js';
    import type { OverflowListItem, OverflowListKey, OverflowListProps } from './interface.js';
    import { markScrollItem, observeSize } from './observers.js';

    type Foundation = OverflowListFoundation<OverflowListBaseProps>;
    type Adapter = OverflowListAdapter<OverflowListBaseProps>;

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

    let view = $state.raw<OverflowListView>(untrack(() => OverflowListFoundation.createView(viewProps())));

    const { foundation, states } = useFoundation<Foundation, Adapter, OverflowListBaseProps, OverflowListBaseState>(
        OverflowListFoundation,
        foundationProps,
        () => OverflowListFoundation.getInitialState(),
        () => ({
            notifyVisibleStateChange: (visibleState) => onVisibleStateChange?.(visibleState),
            updateView: (update) => {
                view = update(view);
            },
            notifyIntersect: (res) => onIntersect?.(res),
            notifyOverflow: (overflowItems) => onOverflow?.(overflowItems as T[]),
        })
    );

    // Scroll mode keeps every item rendered; the observer decides which are visible. `key` is the string
    // SCROLL_KEY_ATTRIBUTE carries.
    const scrollItems = $derived(view.visible.map((entry, index) => ({ item: entry as T, index, key: String(keyOf(entry, index)) })));
    const hidden = $derived(OverflowListFoundation.isHidden(view));
    const collapseItems = $derived(OverflowListFoundation.getVisibleItems(view, keyOption) as Array<{ item: T; index: number; key: OverflowListKey }>);
    const scrollOverflow = $derived(OverflowListFoundation.getOverflowItem({ items: itemList, itemKey: keyOption }, { visibleState: states().visibleState, scrollOverflow: view.scrollOverflow }) as [T[], T[]]);

    const keyOf = (entry: OverflowListItem, index: number) => {
        return OverflowListFoundation.getItemKey(keyOption, entry, index);
    };

    const onContainerResize = (entry: ResizeObserverEntry) => foundation.handleContainerResize(entry.contentRect.width);

    // not clientWidth: rounded widths of fractional items (WebKit text) can add up past the rounded container
    const onItemResize = (entry: ResizeObserverEntry, key: OverflowListKey) => foundation.handleItemResize(key, entry.contentRect.width, view.maxCount);

    const onOverflowResize = (entry: ResizeObserverEntry) => foundation.handleOverflowResize(entry.contentRect.width);

    // Called from an attachment effect: reading the counter there would make the attachment depend on it
    const onScrollElement = () => {
        untrack(() => {
            scrollVersion += 1;
        });
    };

    // syncView reads the items in full here, so in-place edits of a $state array are tracked
    $effect.pre(() => {
        const next = OverflowListFoundation.syncView(
            viewProps(),
            untrack(() => view),
            untrack(() => states().containerWidth)
        );
        view = next;
    });

    // Runs after every change of the view; a change of the item keys always resets it. It settles: handleCommit writes
    // the view only when leaving 'calculating'.
    $effect(() => {
        const current = view;
        untrack(() => foundation.handleCommit(current));
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

<div {...rest} {@attach isScroll ? undefined : observeSize(onContainerResize)} class={[prefix, rest.class]} role={namedRole(rest)} style:max-width={isScroll ? undefined : '100%'} style:visibility={isScroll ? undefined : hidden ? 'hidden' : 'visible'}>
    {#if isScroll}
        {#if overflowRenderDirection !== 'end'}
            {@render overflow?.({ items: scrollOverflow[0], position: 'start' })}
        {/if}
        {#if overflowRenderDirection === 'start'}
            {@render overflow?.({ items: scrollOverflow[1], position: 'end' })}
        {/if}
        <div bind:this={wrapper} {...wrapperProps} class={[wrapperClassName, cssClasses.SCROLL_WRAPPER]} style={wrapperStyle}>
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
