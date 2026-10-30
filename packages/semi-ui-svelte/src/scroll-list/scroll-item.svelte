<script lang="ts" generics="T extends ScrollListItem = ScrollListItem">
    import { untrack } from 'svelte';
    import type { Attachment } from 'svelte/attachments';
    import { on } from 'svelte/events';
    import { cssClasses } from '@fibrae/semi-foundation/scroll-list/constants';
    import ItemFoundation, { type ScrollItemAdapter, type ScrollItemBaseProps, type ScrollItemBaseState } from '@fibrae/semi-foundation/scroll-list/item-foundation';
    import '@fibrae/semi-foundation/scroll-list/scroll-list.scss';
    import { splitControlAttrs } from '../_base/control-attrs.js';
    import useDefaultProps from '../_base/use-default-props.js';
    import useFoundation from '../_base/use-foundation.svelte.js';
    import watch from '../_base/watch.svelte.js';
    import type { ScrollItemProps, ScrollItemSelectData, ScrollListItem } from './interface.js';

    type Foundation = ItemFoundation<T, ScrollItemBaseProps<T>, ScrollItemBaseState>;
    type Adapter = ScrollItemAdapter<T, ScrollItemBaseProps<T>, ScrollItemBaseState>;

    const defaults = useDefaultProps('ScrollItem');

    // No fallback on `selectedIndex`: it is bindable, see Switch
    let { cycled = defaults('cycled', false), list: listProp = defaults('list') as T[] | undefined, mode = defaults('mode', 'wheel'), motion = defaults('motion', true), selectedIndex = $bindable(), transform = defaults('transform'), type = defaults('type'), onSelect, ...rest }: ScrollItemProps<T> = $props();

    const uid = $props.id();
    let root = $state<HTMLDivElement>();
    let outer = $state<HTMLDivElement>();
    let listbox = $state<HTMLUListElement>();
    let selector = $state<HTMLDivElement>();
    let previousIndex: number | undefined;

    const list = $derived(listProp ?? []);
    const current = $derived(selectedIndex ?? defaults('selectedIndex', 0));
    const isWheel = $derived(mode === 'wheel');

    // $bindable needs destructuring, so the foundation reads the props through getters
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
        get type() {
            return type;
        },
    };

    const { foundation, states } = useFoundation<Foundation, Adapter, ScrollItemBaseProps<T>, ScrollItemBaseState>(
        ItemFoundation,
        foundationProps,
        () => ({ prependCount: 0, appendCount: 0 }),
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

    // One flat list: the foundation moves the li of a cycled column outside the render. The copies only fill the wheel,
    // so they are hidden from assistive technology and carry no id: the listbox has one option per item.
    const options = $derived.by(() => {
        const items = (keyPrefix: string) =>
            list.map((item, index) => {
                const selected = current === index;
                const itemTransform = typeof item.transform === 'function' ? item.transform : transform;
                return {
                    key: `${keyPrefix}${index}`,
                    id: keyPrefix ? undefined : optionId(index),
                    copy: Boolean(keyPrefix),
                    index,
                    selected,
                    disabled: item.disabled,
                    clickable: !isWheel && !item.disabled,
                    class: {
                        [`${prefix}-item-sel`]: selected && !isWheel,
                        [`${prefix}-item-disabled`]: Boolean(item.disabled),
                    },
                    text: selected && typeof itemTransform === 'function' ? itemTransform(item.value, item.text) : (item.text ?? item.value),
                };
            });
        if (!isWheel) {
            return items('');
        }
        const copies = (count: number, name: string) => Array.from({ length: count }, (_, i) => items(`${name}_${i}_`));
        return [...copies(states().prependCount, 'pre').toReversed().flat(), ...items(''), ...copies(states().appendCount, 'app').flat()];
    });

    // Focus stays on the listbox and the selected option is its active descendant
    const optionId = (index: number) => {
        return `${uid}-option-${index}`;
    };

    // Wheel clicks are stopped here, where an ancestor's click listener does not see them; a native listener, because
    // Svelte's delegated handlers run after the event has bubbled to the root
    const handleListClick: Attachment<HTMLUListElement> = (node) =>
        on(node, 'click', (event) => {
            if (isWheel) {
                event.stopImmediatePropagation();
                foundation.handleWheelClick(event);
            }
        });

    $effect(() => {
        const next = current;
        const previous = previousIndex;
        previousIndex = next;
        if (previous !== undefined && previous !== next) {
            untrack(() => foundation.syncSelectedIndex(next, previous));
        }
    });

    watch(() => list.length, foundation.syncList);

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
