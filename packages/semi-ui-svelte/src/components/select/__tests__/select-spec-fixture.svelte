<script lang="ts">
    import type { SelectSpecProps } from '@test/specs/select';
    import { Select, type SelectValue } from '..';

    let { store }: { store: SelectSpecProps } = $props();

    const optionList = $derived(store.options.map(({ group, ...option }) => (group ? { ...option, group: { key: group, label: group } } : option)));
    // Svelte has no `defaultValue` and a one-way `value` lets the component override it locally: the spec's default is the
    // binding's initial value and its controlled value goes through a function binding that rejects writes
    // svelte-ignore state_referenced_locally
    let chosen = $state<SelectValue>(store.defaultValue);
</script>

<Select
    allowCreate={store.allowCreate}
    aria-label="Fruit"
    bind:value={
        () => (store.value === undefined ? chosen : store.value),
        (value) => {
            if (store.value === undefined) chosen = value;
        }
    }
    defaultActiveFirstOption={store.defaultActiveFirstOption}
    defaultOpen={store.defaultOpen}
    disabled={store.disabled}
    filter={store.filter}
    max={store.max}
    motion={false}
    multiple={store.multiple}
    onChange={store.onChange}
    onClear={store.onClear}
    onDeselect={store.onDeselect}
    onDropdownVisibleChange={store.onDropdownVisibleChange}
    onExceed={store.onExceed}
    onSearch={store.onSearch}
    onSelect={store.onSelect}
    {optionList}
    searchPosition={store.searchPosition}
    showClear={store.showClear}
>
    {#snippet innerBottomSlot()}
        {#if store.bottomButton}
            <button type="button">slot button</button>
        {/if}
    {/snippet}
</Select>
<button type="button">after</button>
