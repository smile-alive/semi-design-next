<script lang="ts">
    import type { Snippet } from 'svelte';
    import { cssClasses, numbers, strings } from '@fibrae/semi-foundation/cascader/constants';
    import CascaderFoundation, { type BasicData } from '@fibrae/semi-foundation/cascader/foundation';
    import { getColumns, highlightParts } from '@fibrae/semi-foundation/cascader/util';
    import { IconChevronRight, IconTick } from '@fibrae/semi-icons-svelte';
    import VirtualList from '../_base/virtual-list.svelte';
    import { Checkbox, type CheckboxEvent } from '../checkbox/index.js';
    import { useConfig } from '../config-provider/index.js';
    import { useLocale } from '../locale/index.js';
    import { Spin } from '../spin/index.js';
    import type { CascaderData, CascaderEntity, CascaderFilterItemSnippetProps, CascaderLabelSnippetProps, CascaderVirtualize } from './interface.js';

    /** The tree or the search results of a Cascader; not a public component */
    interface SearchData extends BasicData {
        data: CascaderData;
        pathData?: CascaderData[];
    }

    interface ItemProps {
        activeKeys: Set<string>;
        selectedKeys: Set<string>;
        loadedKeys: Set<string>;
        loadingKeys: Set<string>;
        checkedKeys: Set<string>;
        halfCheckedKeys: Set<string>;
        showNext: 'click' | 'hover';
        /** The search results, a listbox, rather than the tree */
        searchable: boolean;
        keyword: string;
        /** A node without isLeaf is a branch while loadData is set */
        hasLoadData: boolean;
        data: Array<CascaderEntity | SearchData>;
        separator: string;
        multiple: boolean;
        virtualize?: CascaderVirtualize;
        /** Id of the tree, or of the listbox of search results; the combobox's aria-controls points at it */
        id: string;
        /** The popup's name, the same as the combobox's */
        ariaLabel?: string;
        ariaLabelledby?: string;
        /** The option the arrow keys are on, pointed at by the combobox's aria-activedescendant */
        keyboardKey: string | null;
        optionId: (key: string) => string;
        label?: Snippet<[CascaderLabelSnippetProps]>;
        filterItem?: Snippet<[CascaderFilterItemSnippetProps]>;
        expandIcon?: Snippet;
        emptyContent?: Snippet | null;
        onItemClick: (event: MouseEvent, item: CascaderEntity | SearchData) => void;
        onItemHover: (event: MouseEvent, item: CascaderEntity) => void;
        onItemCheckboxClick: (item: CascaderEntity | SearchData) => void;
        onListScroll: (event: Event, level: number) => void;
    }

    let {
        activeKeys,
        selectedKeys,
        loadedKeys,
        loadingKeys,
        checkedKeys,
        halfCheckedKeys,
        showNext,
        searchable,
        keyword,
        hasLoadData,
        data,
        separator,
        multiple,
        virtualize,
        id,
        ariaLabel,
        ariaLabelledby,
        keyboardKey,
        optionId,
        label,
        filterItem,
        expandIcon,
        emptyContent,
        onItemClick,
        onItemHover,
        onItemCheckboxClick,
        onListScroll,
    }: ItemProps = $props();

    const config = useConfig();
    const locale = useLocale('Cascader');

    let virtualList = $state<VirtualList>();

    const prefix = cssClasses.PREFIX_OPTION;
    const isEmpty = $derived(!data.length);
    const columns = $derived(searchable || isEmpty ? [] : getColumns(data as CascaderEntity[], activeKeys));
    const results = $derived(searchable ? (data as SearchData[]) : []);
    const sets = $derived({ activeKeys, selectedKeys, loadedKeys, loadingKeys, checkedKeys, halfCheckedKeys });

    const isDisabled = (item: CascaderEntity | SearchData) => {
        return Boolean(item.data.disabled || ('disabled' in item && item.disabled));
    };

    const isBranch = (item: CascaderEntity) => {
        return CascaderFoundation.isBranch(item.data, hasLoadData);
    };

    const handleClick = (event: MouseEvent, item: CascaderEntity | SearchData) => {
        if (!isDisabled(item)) {
            onItemClick(event, item);
        }
    };

    const handleHover = (event: MouseEvent, item: CascaderEntity) => {
        if (!item.data.disabled && showNext === strings.SHOW_NEXT_BY_HOVER) {
            onItemHover(event, item);
        }
    };

    const handleCheck = (event: CheckboxEvent, item: CascaderEntity | SearchData) => {
        // the click on the checkbox must not also reach the option as a click
        event.stopPropagation();
        onItemCheckboxClick(item);
    };

    const resultClass = (item: SearchData) => {
        return [
            prefix,
            {
                [`${prefix}-flatten`]: !filterItem,
                [`${prefix}-disabled`]: item.disabled,
                [`${prefix}-select`]: selectedKeys.has(item.key) && !multiple,
                [`${prefix}-focused`]: item.key === keyboardKey,
            },
        ];
    };

    const resultAttrs = (item: SearchData, rowStyle?: string) => {
        return {
            id: optionId(item.key),
            role: 'option' as const,
            'aria-disabled': item.disabled ? (true as const) : undefined,
            'aria-selected': multiple ? checkedKeys.has(item.key) : selectedKeys.has(item.key),
            style: rowStyle,
        };
    };

    /** Exposed so the Cascader can scroll the virtual search results; false when they are not virtual */
    export function scrollToItem(index: number) {
        if (!virtualList) {
            return false;
        }
        virtualList.scrollToItem(index);
        return true;
    }
</script>

{#snippet checkbox(item: CascaderEntity | SearchData)}
    <Checkbox aria-hidden="true" bind:checked={() => checkedKeys.has(item.key), () => {}} class={`${prefix}-label-checkbox`} disabled={item.data.disabled} indeterminate={halfCheckedKeys.has(item.key)} onChange={(event) => handleCheck(event, item)} tabindex={-1} />
{/snippet}

{#snippet result(item: SearchData, rowStyle?: string)}
    {#if filterItem}
        {@render filterItem({
            props: { ...resultAttrs(item, rowStyle), class: resultClass(item), onclick: (event) => handleClick(event, item) },
            inputValue: keyword,
            disabled: item.disabled,
            data: item.pathData ?? [],
            checkStatus: { checked: checkedKeys.has(item.key), halfChecked: halfCheckedKeys.has(item.key) },
            selected: selectedKeys.has(item.key),
            onCheck: (event) => handleCheck(event, item),
        })}
    {:else}
        <!-- the combobox handles the keys: it points at this option with aria-activedescendant -->
        <li {...resultAttrs(item, rowStyle)} class={resultClass(item)} onclick={(event) => handleClick(event, item)}>
            <span class={`${prefix}-label`}>
                {#if multiple}
                    {@render checkbox(item)}
                {:else}
                    <span aria-hidden="true" class={[`${prefix}-icon`, `${prefix}-icon-empty`]}></span>
                {/if}
                {#each highlightParts(item.searchText, keyword, separator) as part, index (index)}
                    {#if part.match}
                        <span class={`${prefix}-label-highlight`}>{part.text}</span>
                    {:else}
                        {part.text}
                    {/if}
                {/each}
            </span>
        </li>
    {/if}
{/snippet}

<!-- the id stays for the combobox's aria-controls; with nothing to choose there is no tree or listbox -->
{#if isEmpty}
    <div class={[`${prefix}-lists`, `${prefix}-lists-empty`]} {id}>
        {#if emptyContent !== null}
            <div class={[prefix, `${prefix}-empty`]}>
                <span class={`${prefix}-label`} x-semi-prop="emptyContent">
                    {#if emptyContent}
                        {@render emptyContent()}
                    {:else}
                        {locale().locale.emptyText}
                    {/if}
                </span>
            </div>
        {/if}
    </div>
{:else}
    <div aria-label={ariaLabel} aria-labelledby={ariaLabelledby} aria-multiselectable={multiple || undefined} class={`${prefix}-lists`} {id} role={searchable ? 'listbox' : 'tree'}>
        {#if searchable}
            {#if virtualize}
                <VirtualList
                    bind:this={virtualList}
                    height={virtualize.height ?? numbers.LIST_HEIGHT}
                    innerAttrs={{ class: `${prefix}-list`, role: 'none' }}
                    innerTag="ul"
                    itemCount={results.length}
                    itemKey={(index) => results[index]?.key ?? index}
                    itemSize={virtualize.itemSize}
                    style={config.direction ? `direction: ${config.direction}` : undefined}
                    tabindex={-1}
                    width={virtualize.width ?? '100%'}
                >
                    {#snippet children({ index, style }: { index: number; style: string })}
                        {#if results[index]}
                            {@render result(results[index], style)}
                        {/if}
                    {/snippet}
                </VirtualList>
            {:else}
                <ul class={`${prefix}-list`} role="none">
                    {#each results as item (item.key)}
                        {@render result(item)}
                    {/each}
                </ul>
            {/if}
        {:else}
            <!--
                One list per level of the active path, together one flat tree: aria-level, aria-setsize and aria-posinset
                carry the hierarchy. Owning the next list as a group (aria-owns) would make it part of the branch's name.
            -->
            {#each columns as column (column.items[0].key)}
                <ul class={`${prefix}-list`} role="none" onscroll={(event) => onListScroll(event, column.level)}>
                    {#each column.items as item, index (item.key)}
                        {@const rowState = CascaderFoundation.getTreeItemState(item.key, sets, multiple, isBranch(item))}
                        <!-- the combobox handles the keys: it points at this option with aria-activedescendant -->
                        <li
                            aria-busy={rowState.aria['aria-busy']}
                            aria-checked={rowState.aria['aria-checked']}
                            aria-disabled={item.data.disabled || undefined}
                            aria-expanded={rowState.aria['aria-expanded']}
                            aria-level={column.level + 1}
                            aria-posinset={index + 1}
                            aria-selected={rowState.aria['aria-selected']}
                            aria-setsize={column.items.length}
                            class={[
                                prefix,
                                {
                                    [`${prefix}-active`]: rowState.showActive,
                                    [`${prefix}-select`]: rowState.showSelected,
                                    [`${prefix}-disabled`]: item.data.disabled,
                                    [`${prefix}-focused`]: item.key === keyboardKey,
                                },
                            ]}
                            id={optionId(item.key)}
                            role="treeitem"
                            onclick={(event) => handleClick(event, item)}
                            onmouseenter={(event) => handleHover(event, item)}
                        >
                            <span class={`${prefix}-label`}>
                                {#if multiple}
                                    {@render checkbox(item)}
                                {:else if rowState.selected}
                                    <IconTick class={[`${prefix}-icon`, `${prefix}-icon-active`]} />
                                {:else}
                                    <span aria-hidden="true" class={[`${prefix}-icon`, `${prefix}-icon-empty`]}></span>
                                {/if}
                                <span>
                                    {#if label}
                                        {@render label({ item: item.data })}
                                    {:else}
                                        {item.data.label}
                                    {/if}
                                </span>
                            </span>
                            {#if isBranch(item)}
                                {#if rowState.loading}
                                    <!-- the option carries the state as aria-busy; the spinner's own name would join the option's name -->
                                    <span aria-hidden="true"><Spin wrapperClassName={`${prefix}-spin-icon ${prefix}-icon-left`} /></span>
                                {:else if expandIcon}
                                    {@render expandIcon()}
                                {:else}
                                    <IconChevronRight class={[`${prefix}-icon`, `${prefix}-icon-expand`, `${prefix}-icon-left`]} />
                                {/if}
                            {/if}
                        </li>
                    {/each}
                </ul>
            {/each}
        {/if}
    </div>
{/if}
