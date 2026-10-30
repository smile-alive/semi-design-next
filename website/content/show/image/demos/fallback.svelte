<script lang="ts">
    import { IconUploadError } from '@fibrae/semi-icons-svelte';
    import { Image } from '@fibrae/semi-ui-svelte';
</script>

<div style="display: flex; align-items: center; flex-direction: column">
    <span>加载失败默认样式</span>
    <Image alt="加载失败的图片" height={200} src="https://load-error.jpeg" width={200} />
    <br />
    <span>自定义加载失败占位图</span>
    <Image alt="加载失败的图片" height={200} src="https://load-error.jpeg" width={200}>
        {#snippet fallback()}
            <IconUploadError style="font-size: 50px" />
        {/snippet}
    </Image>
</div>
