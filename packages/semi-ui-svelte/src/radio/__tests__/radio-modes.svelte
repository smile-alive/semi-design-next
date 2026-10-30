<script lang="ts">
    import type { RadioProps } from '../interface';
    import Radio from '../radio.svelte';

    let { mode, store, extra = {} }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { value?: boolean; accept: boolean; log: string[] }; extra?: RadioProps } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

{#if mode === 'bind'}
    <Radio {...extra} bind:checked={store.value} onChange={(event) => log(`change ${event.target.checked}`)}>label</Radio>
{:else if mode === 'function'}
    <Radio
        {...extra}
        bind:checked={
            () => store.value,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.value = value;
            }
        }
        onChange={(event) => log(`change ${event.target.checked}`)}
    >
        label
    </Radio>
{:else if mode === 'one-way'}
    <Radio {...extra} checked={store.value} onChange={(event) => log(`change ${event.target.checked}`)}>label</Radio>
{:else}
    <Radio {...extra} onChange={(event) => log(`change ${event.target.checked}`)}>label</Radio>
{/if}
