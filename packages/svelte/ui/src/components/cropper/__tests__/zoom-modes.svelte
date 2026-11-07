<script lang="ts">
    import Cropper from '../cropper.svelte';

    let { mode, store }: { mode: 'bind' | 'function' | 'one-way' | 'uncontrolled'; store: { value?: number; accept: boolean; log: string[] } } = $props();

    const log = (entry: string) => {
        store.log.push(entry);
    };
    const src = 'https://example.com/a.png';
</script>

{#if mode === 'bind'}
    <Cropper bind:zoom={store.value} onZoomChange={(value) => log(`change ${value}`)} rotate={0} {src} />
{:else if mode === 'function'}
    <Cropper
        bind:zoom={
            () => store.value,
            (value) => {
                log(`set ${value}`);
                if (store.accept) store.value = value;
            }
        }
        onZoomChange={(value) => log(`change ${value}`)}
        rotate={0}
        {src}
    />
{:else if mode === 'one-way'}
    <Cropper onZoomChange={(value) => log(`change ${value}`)} rotate={0} {src} zoom={store.value} />
{:else}
    <Cropper onZoomChange={(value) => log(`change ${value}`)} rotate={0} {src} />
{/if}
