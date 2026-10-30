<script lang="ts">
    import { IconDelete, IconDownload, IconExpand, IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, ImagePreview, Upload, type FileItem } from '@fibrae/semi-ui-svelte';

    let visible = $state(false);
    const fileList: FileItem[] = [
        {
            uid: '1',
            name: 'dyBag.png',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
    ];
</script>

<Upload action="https://api.semi.design/upload" {fileList} itemStyle="width: 300px">
    {#snippet fileOperation({ file, onRemove })}
        <div style="display: flex; column-gap: 8px; padding: 0 8px">
            <Button aria-label="预览" size="small" theme="borderless" type="tertiary" onclick={() => (visible = true)}>
                {#snippet icon()}<IconExpand />{/snippet}
            </Button>
            <Button aria-label="下载" size="small" theme="borderless" type="tertiary">
                {#snippet icon()}<IconDownload />{/snippet}
            </Button>
            <Button aria-label="删除" size="small" theme="borderless" type="tertiary" onclick={() => onRemove()}>
                {#snippet icon()}<IconDelete />{/snippet}
            </Button>
            <ImagePreview bind:visible src={file.url} />
        </div>
    {/snippet}
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传
    </Button>
</Upload>
