<script lang="ts">
    import type { RadioGroupProps, RadioValue } from '../interface';
    import RadioGroup from '../radio-group.svelte';
    import Radio from '../radio.svelte';

    let { mode, store, extra = {} }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { value?: RadioValue; accept: boolean; log: string[] }; extra?: RadioGroupProps } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#snippet radios()}
    <Radio value="A">A</Radio>
    <Radio value="B">B</Radio>
    <Radio value="C">C</Radio>
{/snippet}

{#if mode === 'bind'}
    <RadioGroup {...extra} bind:value={store.value} onChange={(event) => log(`change ${event.target.value}`)}>{@render radios()}</RadioGroup>
{:else if mode === 'function'}
    <RadioGroup
        {...extra}
        bind:value={
            () => store.value,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.value = value;
            }
        }
        onChange={(event) => log(`change ${event.target.value}`)}
    >
        {@render radios()}
    </RadioGroup>
{:else if mode === 'one-way'}
    <RadioGroup {...extra} onChange={(event) => log(`change ${event.target.value}`)} value={store.value}>{@render radios()}</RadioGroup>
{:else}
    <RadioGroup {...extra} onChange={(event) => log(`change ${event.target.value}`)}>{@render radios()}</RadioGroup>
{/if}
