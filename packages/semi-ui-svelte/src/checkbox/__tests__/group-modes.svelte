<script lang="ts">
    import CheckboxGroup from '../checkbox-group.svelte';
    import type { CheckboxValue } from '../interface';

    let { mode, store }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { value?: CheckboxValue[]; accept: boolean; log: string[] } } = $props();

    const options = ['a', 'b', 'c'];
    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <CheckboxGroup bind:value={store.value} onChange={(value) => log(`change ${JSON.stringify(value)}`)} {options} />
{:else if mode === 'function'}
    <CheckboxGroup
        bind:value={
            () => store.value,
            (value) => {
                log(`set ${JSON.stringify(value)}`);
                if (store.accept) store.value = value;
            }
        }
        onChange={(value) => log(`change ${JSON.stringify(value)}`)}
        {options}
    />
{:else if mode === 'one-way'}
    <CheckboxGroup onChange={(value) => log(`change ${JSON.stringify(value)}`)} {options} value={store.value} />
{:else}
    <CheckboxGroup onChange={(value) => log(`change ${JSON.stringify(value)}`)} {options} />
{/if}
