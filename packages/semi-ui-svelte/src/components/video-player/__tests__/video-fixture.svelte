<script lang="ts">
    import type { Locale } from '@fibrae/semi-ui-svelte/locale';
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import type { VideoPlayerProps } from '../interface';
    import VideoPlayer from '../video-player.svelte';

    let { store }: { store: { props: VideoPlayerProps; locale?: Locale; handle?: VideoPlayer } } = $props();
</script>

{#if store.locale}
    <ConfigProvider locale={store.locale}>
        <VideoPlayer bind:this={store.handle} {...store.props} />
    </ConfigProvider>
{:else}
    <VideoPlayer bind:this={store.handle} {...store.props} />
{/if}
