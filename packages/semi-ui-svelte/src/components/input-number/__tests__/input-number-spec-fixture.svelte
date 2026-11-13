<script lang="ts">
    import type { InputNumberSpecProps } from '@test/specs/input-number';
    import InputNumber from '../input-number.svelte';

    let { store }: { store: InputNumberSpecProps } = $props();

    const rest = $derived.by(() => {
        const { value, defaultValue, className, ...others } = store;
        return { ...others, class: className };
    });
    // Svelte has no `defaultValue` and a one-way `value` lets the component override it locally: the spec's default is
    // the binding's initial value and its controlled value goes through a function binding that ignores writes
    // svelte-ignore state_referenced_locally
    let typed = $state<number | string | undefined>(store.defaultValue);
</script>

<InputNumber
    bind:value={
        () => (store.value === undefined ? typed : store.value),
        (next) => {
            typed = next;
        }
    }
    {...rest}
/>
