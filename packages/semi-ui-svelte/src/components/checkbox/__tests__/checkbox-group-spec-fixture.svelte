<script lang="ts">
    import type { CheckboxGroupSpecProps } from '@test/specs/checkbox';
    import CheckboxGroup from '../checkbox-group.svelte';
    import Checkbox from '../checkbox.svelte';

    let { store }: { store: CheckboxGroupSpecProps } = $props();

    // Svelte has no `defaultValue` and a one-way `value` lets the component override it locally: the spec's default
    // is the binding's initial value and its controlled value goes through a function binding that rejects writes
    // svelte-ignore state_referenced_locally
    let chosen = $state(store.defaultValue);
</script>

<CheckboxGroup
    aria-invalid={store['aria-invalid']}
    aria-label={store['aria-label']}
    bind:value={
        () => (store.value === undefined ? chosen : store.value),
        (value) => {
            chosen = value ?? undefined;
        }
    }
    direction={store.direction}
    disabled={store.disabled}
    name={store.name}
    onBlur={store.onBlur}
    onChange={store.onChange}
    options={store.asChildren ? undefined : store.options}
    title={store.title}
    type={store.type}
>
    {#each store.options as option (typeof option === 'string' ? option : option.value)}
        {@const item = typeof option === 'string' ? { value: option, label: option, disabled: undefined } : option}
        {#snippet label()}{item.label}{/snippet}
        <Checkbox children={label} disabled={item.disabled} value={item.value} />
    {/each}
</CheckboxGroup>
