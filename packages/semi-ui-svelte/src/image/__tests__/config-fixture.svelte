<script lang="ts">
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import type { ConfigProviderProps } from '../../config-provider/interface';
    import ImagePreview from '../preview.svelte';
    import { srcList } from './helpers';

    // `container` puts the popup container on ConfigProvider; `own` adds a getPopupContainer on the preview that wins over it
    let { props = {}, container = false, own }: { props?: ConfigProviderProps; container?: boolean; own?: () => HTMLElement } = $props();

    let host = $state.raw<HTMLDivElement | null>(null);
</script>

<div bind:this={host} class="preview-container"></div>
<ConfigProvider {...props} getPopupContainer={container ? () => host as HTMLDivElement : props.getPopupContainer}>
    <ImagePreview getPopupContainer={own} src={srcList} visible />
</ConfigProvider>
