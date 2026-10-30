<script lang="ts">
    import { Image, ImagePreview } from '@fibrae/semi-ui-svelte';

    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg'];
    const titles = srcList.map((_, index) => `lamp${index + 1}`);
</script>

<ImagePreview src={srcList} {titles}>
    {#snippet title({ title })}
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center">
            <span style="background: black; padding: 0 10px">自定义标题：{title}</span>
        </div>
    {/snippet}
    <div>
        {#each srcList as src, index (src)}
            <Image alt={titles[index]} {src} style="margin-right: 5px" width={200} />
        {/each}
    </div>
</ImagePreview>
