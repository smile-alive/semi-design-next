<script lang="ts" generics="T extends ScrollListItem = ScrollListItem">
    import type { Attachment } from 'svelte/attachments';
    import { on } from 'svelte/events';
    import { cssClasses } from '@fibrae/semi-foundation/components/scroll-list/constants';
    import ItemFoundation, { type ScrollItemAdapter, type ScrollItemBaseProps, type ScrollItemBaseState, wheelMode } from '@fibrae/semi-foundation/components/scroll-list/item-foundation';
    import '@fibrae/semi-foundation/components/scroll-list/scroll-list.scss';
    import { useDefaultProps, useFoundation } from '../../base/index.js';
    import { splitControlAttrs } from '../../utils/index.js';
    import type { ScrollItemProps, ScrollItemSelectData, ScrollListItem } from './interface.js';

    type Foundation = ItemFoundation<T, ScrollItemBaseProps<T>>;
    type Adapter = ScrollItemAdapter<T, ScrollItemBaseProps<T>>;

    const defaults = useDefaultProps('ScrollItem');

    // No fallback on `selectedIndex`: it is bindable, see Switch
    let { cycled = defaults('cycled', false), list: listProp = defaults('list') as T[] | undefined, mode = defaults('mode', wheelMode), motion = defaults('motion', true), selectedIndex = $bindable(), transform = defaults('transform'), onSelect, ...rest }: ScrollItemProps<T> = $props();

    const uid = $props.id();
    let root = $state<HTMLDivElement>();
    let outer = $state<HTMLDivElement>();
    let listbox = $state<HTMLUListElement>();
    let selector = $state<HTMLDivElement>();

    const list = $derived(listProp ?? []);
    const current = $derived(selectedIndex ?? defaults('selectedIndex', 0));
    const isWheel = $derived(mode === wheelMode);

    const foundationProps: ScrollItemBaseProps<T> = {
        get cycled() {
            return cycled;
        },
        get list() {
            return list;
        },
        get mode() {
            return mode;
        },
        get motion() {
            return motion;
        },
        get selectedIndex() {
            return current;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, ScrollItemBaseProps<T>, ScrollItemBaseState>(
        ItemFoundation,
        foundationProps,
        () => ItemFoundation.getInitialState(),
        () => ({
            getListNode: () => listbox ?? null,
            getScrollNode: () => (isWheel ? outer : root) ?? null,
            getSelectorNode: () => selector ?? null,
            notifySelectItem: (data) => {
                selectedIndex = data.index;
                onSelect?.(data as ScrollItemSelectData<T>);
            },
        })
    );

    const prefix = cssClasses.PREFIX;

    // aria-label, aria-labelledby and aria-describedby name the listbox, not the role-less root
    const attrs = $derived(splitControlAttrs(rest, (key) => key === 'aria-label' || key === 'aria-labelledby' || key === 'aria-describedby'));

    // The copies only fill the wheel, so they are hidden from assistive technology and carry no id: the listbox has one
    // option per item.
    const options = $derived(
        ItemFoundation.getRows({ list, mode }, states()).map(({ key, index, copy }) => {
            const item = list[index];
            const selected = current === index;
            return {
                key,
                id: copy ? undefined : optionId(index),
                copy,
                index,
                selected,
                disabled: item.disabled,
                clickable: !isWheel && !item.disabled,
                class: {
                    [`${prefix}-item-sel`]: selected && !isWheel,
                    [cssClasses.SELECTED]: isWheel && key === states().highlightedKey,
                    [`${prefix}-item-disabled`]: Boolean(item.disabled),
                },
                text: ItemFoundation.getItemText(item, selected, transform),
            };
        })
    );

    const optionId = (index: number) => {
        return `${uid}-option-${index}`;
    };

    // A native listener, because Svelte's delegated handlers run after the event has bubbled to the root, and the
    // foundation stops a wheel click before an ancestor's listener sees it
    const handleListClick: Attachment<HTMLUListElement> = (node) =>
        on(node, 'click', (event) => {
            if (isWheel) {
                foundation.handleWheelClick(event);
            }
        });

    export function scrollToIndex(_selectedIndex?: number, duration?: number) {
        foundation.scrollToSelected(duration);
    }
</script>

{#snippet listboxList()}
    <ul bind:this={listbox} {...attrs.control} {@attach handleListClick} aria-activedescendant={list[current] ? optionId(current) : undefined} aria-multiselectable="false" role="listbox" tabindex="0" onkeydown={foundation.handleKeyDown}>
        {#each options as option (option.key)}
            <li aria-disabled={option.disabled} aria-hidden={option.copy || undefined} aria-selected={option.selected} class={option.class} id={option.id} role="option" onclick={option.clickable ? () => foundation.selectIndex(option.index) : undefined}>
                {option.text}
            </li>
        {/each}
    </ul>
{/snippet}

<div bind:this={root} {...attrs.root} class={[isWheel ? `${prefix}-item-wheel` : `${prefix}-item`, rest.class]}>
    {#if isWheel}
        <div class={[`${prefix}-shade`, `${prefix}-shade-pre`]}></div>
        <div bind:this={selector} class={`${prefix}-selector`}></div>
        <div class={[`${prefix}-shade`, `${prefix}-shade-post`]}></div>
        <div bind:this={outer} class={[`${prefix}-list-outer`, { [`${prefix}-list-outer-nocycle`]: !cycled }]} onscroll={foundation.handleScroll}>
            {@render listboxList()}
        </div>
    {:else}
        {@render listboxList()}
    {/if}
</div>
