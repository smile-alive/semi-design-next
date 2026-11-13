<script lang="ts">
    import type { CheckboxSpecProps } from '@test/specs/checkbox';
    import Checkbox from '../checkbox.svelte';

    let { store }: { store: CheckboxSpecProps } = $props();

    // Svelte has no `defaultChecked` and a one-way `checked` lets the component override it locally: the spec's default
    // is the binding's initial value and its controlled value goes through a function binding that rejects writes
    // svelte-ignore state_referenced_locally
    let chosen = $state<boolean | undefined>(store.defaultChecked);
</script>

{#snippet label()}{store.label}{/snippet}
{#snippet extra()}{store.extra}{/snippet}

<Checkbox
    aria-describedby={store['aria-describedby']}
    aria-invalid={store['aria-invalid']}
    aria-label={store['aria-label']}
    bind:checked={
        () => (store.checked === undefined ? chosen : store.checked),
        (value) => {
            chosen = value ?? undefined;
        }
    }
    children={store.label === undefined ? undefined : label}
    disabled={store.disabled}
    extra={store.extra === undefined ? undefined : extra}
    id={store.id}
    indeterminate={store.indeterminate}
    name={store.name}
    onChange={store.onChange}
    tabindex={store.tabIndex}
    title={store.title}
    type={store.type}
    value={store.value}
/>
