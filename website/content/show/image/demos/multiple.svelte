<script lang="ts">
    import { Image, ImagePreview } from '@fibrae/semi-ui-svelte';

    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg', '/assets/root-web-sites/colorful.jpg'];
</script>

<ImagePreview src={srcList}>
    {#each srcList as src, index (src)}
        <Image alt="lamp{index + 1}" {src} style="margin-right: 5px" width={200} />
    {/each}
</ImagePreview>
