<script lang="ts">
    import type { SwitchSpecProps } from '@test/specs/switch';
    import Switch from '../switch.svelte';

    let { store }: { store: SwitchSpecProps } = $props();

    // Svelte has no `defaultChecked` and a one-way `checked` lets the component override it locally: the spec's default
    // is the binding's initial value and its controlled value goes through a function binding that rejects writes
    // svelte-ignore state_referenced_locally
    let chosen = $state<boolean | undefined>(store.defaultChecked);
</script>

{#snippet on()}{store.checkedText}{/snippet}
{#snippet off()}{store.uncheckedText}{/snippet}

<Switch
    aria-describedby={store['aria-describedby']}
    aria-invalid={store['aria-invalid']}
    aria-label={store['aria-label']}
    bind:checked={
        () => (store.checked === undefined ? chosen : store.checked),
        (value) => {
            chosen = value ?? undefined;
        }
    }
    checkedText={store.checkedText === undefined ? undefined : on}
    disabled={store.disabled}
    id={store.id}
    loading={store.loading}
    name={store.name}
    onChange={store.onChange}
    size={store.size}
    tabindex={store.tabIndex}
    title={store.title}
    uncheckedText={store.uncheckedText === undefined ? undefined : off}
/>
