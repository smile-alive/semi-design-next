<script lang="ts">
    import en_US from '@fibrae/semi-foundation/locale/source/en_US';
    import { ConfigProvider } from '../../config-provider';
    import ColorPicker from '../color-picker.svelte';
    import type { ColorValue } from '../interface';

    let { mode, store }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { value?: ColorValue; accept: boolean; log: string[] } } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
</script>

<ConfigProvider locale={en_US}>
    {#if mode === 'bind'}
        <ColorPicker bind:value={store.value} onChange={(value) => log(`change ${value.hex}`)} />
    {:else if mode === 'function'}
        <ColorPicker
            bind:value={
                () => store.value,
                (value) => {
                    log(`set ${value?.hex}`);
                    if (store.accept && value) store.value = value;
                }
            }
            onChange={(value) => log(`change ${value.hex}`)}
        />
    {:else if mode === 'one-way'}
        <ColorPicker onChange={(value) => log(`change ${value.hex}`)} value={store.value} />
    {:else}
        <ColorPicker onChange={(value) => log(`change ${value.hex}`)} />
    {/if}
</ConfigProvider>
<output aria-label="hex">{store.value?.hex}</output>
