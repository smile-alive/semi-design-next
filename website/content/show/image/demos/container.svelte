<script lang="ts">
    import { Image, ImagePreview } from '@fibrae/semi-ui-svelte';

    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'];

    const getPopupContainer = () => {
        const node = document.getElementById('container') as HTMLElement;
        return node;
    };
</script>

<div id="container" style="height: 400px; position: relative">
    <ImagePreview {getPopupContainer} src={srcList} style="height: 100%; display: flex; align-items: center; justify-content: center">
        {#each srcList as src, index (src)}
            <Image alt="lamp{index + 1}" {src} style="margin-inline-end: 5px" width={200} />
        {/each}
    </ImagePreview>
</div>
