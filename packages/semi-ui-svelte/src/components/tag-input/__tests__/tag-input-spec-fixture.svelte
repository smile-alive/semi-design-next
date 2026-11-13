<script lang="ts">
    import type { TagInputSpecProps } from '@test/specs/tag-input';
    import TagInput from '../tag-input.svelte';

    let { store }: { store: TagInputSpecProps } = $props();

    // Svelte has no `defaultValue`: the spec's default is the binding's initial value, and a controlled value or
    // inputValue goes through a function binding whose setter keeps what the component wrote for the uncontrolled case
    // svelte-ignore state_referenced_locally
    let tags = $state<string[] | null | undefined>(store.defaultValue);
    let text = $state<string | undefined>(undefined);
</script>

<TagInput
    {...store.attrs}
    addOnBlur={store.addOnBlur}
    allowDuplicates={store.allowDuplicates}
    bind:inputValue={
        () => (store.inputValue === undefined ? text : store.inputValue),
        (next) => {
            text = next;
        }
    }
    bind:value={
        () => (store.value === undefined ? tags : store.value),
        (next) => {
            tags = next;
        }
    }
    disabled={store.disabled}
    max={store.max}
    maxLength={store.maxLength}
    maxTagCount={store.maxTagCount}
    onAdd={store.onAdd}
    onBlur={store.onBlur}
    onChange={store.onChange}
    onExceed={store.onExceed}
    onFocus={store.onFocus}
    onInputChange={store.onInputChange}
    onInputExceed={store.onInputExceed}
    onRemove={store.onRemove}
    placeholder={store.placeholder}
    separator={store.separator}
    showClear={store.showClear}
/>
