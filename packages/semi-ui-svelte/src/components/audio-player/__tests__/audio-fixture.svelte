<script lang="ts">
    import type { Locale } from '@fibrae/semi-ui-svelte/locale';
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import AudioPlayer from '../audio-player.svelte';
    import type { AudioPlayerProps } from '../interface';

    let { store }: { store: { props: AudioPlayerProps; locale?: Locale } } = $props();
</script>

{#if store.locale}
    <ConfigProvider locale={store.locale}>
        <AudioPlayer {...store.props} />
    </ConfigProvider>
{:else}
    <AudioPlayer {...store.props} />
{/if}
