<script lang="ts">
    import type { RadioGroupSpecProps } from '@test/specs/radio';
    import RadioGroup from '../radio-group.svelte';
    import Radio from '../radio.svelte';

    let { store }: { store: RadioGroupSpecProps } = $props();

    // Svelte has no `defaultValue` and a one-way `value` lets the component override it locally: the spec's default
    // is the binding's initial value and its controlled value goes through a function binding that rejects writes
    // svelte-ignore state_referenced_locally
    let chosen = $state(store.defaultValue);
</script>

<RadioGroup
    aria-label={store['aria-label']}
    bind:value={
        () => (store.value === undefined ? chosen : store.value),
        (value) => {
            chosen = value;
        }
    }
    buttonSize={store.buttonSize}
    direction={store.direction}
    disabled={store.disabled}
    mode={store.mode}
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
        <Radio children={label} disabled={item.disabled} value={item.value} />
    {/each}
</RadioGroup>
