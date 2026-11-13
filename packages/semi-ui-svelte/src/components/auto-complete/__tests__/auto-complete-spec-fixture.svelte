<script lang="ts">
    import type { AutoCompleteSpecProps } from '@test/specs/auto-complete';
    import { AutoComplete } from '..';

    let { store }: { store: AutoCompleteSpecProps } = $props();

    // Svelte has no `defaultValue` and a one-way `value` lets the component override it locally: the spec's default is the
    // binding's initial value and its controlled value goes through a function binding that rejects writes
    // svelte-ignore state_referenced_locally
    let typed = $state<string | number | undefined>(store.defaultValue);
</script>

<AutoComplete
    aria-label="City"
    bind:value={
        () => (store.value === undefined ? typed : store.value),
        (value) => {
            if (store.value === undefined) typed = value;
        }
    }
    data={store.data}
    defaultActiveFirstOption={store.defaultActiveFirstOption}
    defaultOpen={store.defaultOpen}
    disabled={store.disabled}
    loading={store.loading}
    motion={false}
    onChange={store.onChange}
    onDropdownVisibleChange={store.onDropdownVisibleChange}
    onSearch={store.onSearch}
    onSelect={store.onSelect}
/>
<button type="button">after</button>
