<script lang="ts">
    import { IconChevronLeft, IconChevronRight, IconDownload, IconMinus, IconPlus, IconRealSizeStroked, IconRotate, IconWindowAdaptionStroked } from '@fibrae/semi-icons-svelte';
    import { Button, Image, ImagePreview } from '@fibrae/semi-ui-svelte';

    const srcList = ['/assets/root-web-sites/abstract.jpg', '/assets/root-web-sites/sky.jpg', '/assets/root-web-sites/greenleaf.jpg'];
</script>

<ImagePreview src={srcList}>
    {#snippet previewMenu(menu)}
        <div style="background: grey; height: 40px; width: 280px; display: flex; align-items: center; justify-content: space-around; border-radius: 3px">
            <Button aria-label="上一张" disabled={menu.disabledPrev} type="tertiary" onclick={menu.onPrev}>
                {#snippet icon()}
                    <IconChevronLeft size="large" />
                {/snippet}
            </Button>
            <Button aria-label="下一张" disabled={menu.disabledNext} type="tertiary" onclick={menu.onNext}>
                {#snippet icon()}
                    <IconChevronRight size="large" />
                {/snippet}
            </Button>
            <Button aria-label="缩小" disabled={menu.disabledZoomOut} type="tertiary" onclick={menu.onZoomOut}>
                {#snippet icon()}
                    <IconMinus size="large" />
                {/snippet}
            </Button>
            <Button aria-label="放大" disabled={menu.disabledZoomIn} type="tertiary" onclick={menu.onZoomIn}>
                {#snippet icon()}
                    <IconPlus size="large" />
                {/snippet}
            </Button>
            <Button aria-label={menu.ratio === 'adaptation' ? '原始尺寸' : '适应页面'} type="tertiary" onclick={menu.onRatioClick}>
                {#snippet icon()}
                    {#if menu.ratio === 'adaptation'}
                        <IconRealSizeStroked size="large" />
                    {:else}
                        <IconWindowAdaptionStroked size="large" />
                    {/if}
                {/snippet}
            </Button>
            <Button aria-label="旋转" type="tertiary" onclick={menu.onRotateLeft}>
                {#snippet icon()}
                    <IconRotate size="large" />
                {/snippet}
            </Button>
            <Button aria-label="下载" disabled={menu.disableDownload} type="tertiary" onclick={menu.onDownload}>
                {#snippet icon()}
                    <IconDownload size="large" />
                {/snippet}
            </Button>
        </div>
    {/snippet}
    {#each srcList as src, index (src)}
        <Image alt="lamp{index + 1}" {src} style="margin-inline-end: 5px" width={200} />
    {/each}
</ImagePreview>
