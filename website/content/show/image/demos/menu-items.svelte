<script lang="ts">
    import { IconInfoCircle } from '@fibrae/semi-icons-svelte';
    import { Divider, Image, ImagePreview, Tooltip } from '@fibrae/semi-ui-svelte';

    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'];
</script>

<ImagePreview src={srcList}>
    {#snippet previewMenu({ menuItems })}
        <div style="display: flex; background-color: rgba(0, 0, 0, 0.75); align-items: center; padding: 5px 16px; border-radius: 4px">
            {@render menuItems()}
            <Divider layout="vertical" />
            <Tooltip>
                {#snippet content()}
                    我是一个自定义操作
                {/snippet}
                <IconInfoCircle size="large" />
            </Tooltip>
        </div>
    {/snippet}
    {#each srcList as src, index (src)}
        <Image alt="lamp{index + 1}" {src} width={200} />
    {/each}
</ImagePreview>
