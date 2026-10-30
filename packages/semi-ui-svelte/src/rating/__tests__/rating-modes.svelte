<script lang="ts">
    import en_US from '@fibrae/semi-foundation/locale/source/en_US';
    import { ConfigProvider } from '../../config-provider';
    import Rating from '../rating.svelte';

    let { mode, store }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { value?: number; accept: boolean; log: string[] } } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

<ConfigProvider locale={en_US}>
    {#if mode === 'bind'}
        <Rating bind:value={store.value} onChange={(value) => log(`change ${value}`)} />
    {:else if mode === 'function'}
        <Rating
            bind:value={
                () => store.value,
                (value) => {
                    log(`set ${value}`);
                    if (store.accept) store.value = value;
                }
            }
            onChange={(value) => log(`change ${value}`)}
        />
    {:else if mode === 'one-way'}
        <Rating onChange={(value) => log(`change ${value}`)} value={store.value} />
    {:else}
        <Rating onChange={(value) => log(`change ${value}`)} />
    {/if}
</ConfigProvider>
