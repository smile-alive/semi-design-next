<script lang="ts">
    import { IconDelete, IconDownload, IconEyeOpened, IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type FileItem } from '@fibrae/semi-ui-svelte';

    const action = 'https://api.semi.design/upload';
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

<Upload {action} {fileList} itemStyle="width: 300px">
    {#snippet fileOperation({ onRemove })}
        <div style="display: flex; column-gap: 8px; padding: 0 8px">
            <Button aria-label="预览" size="small" theme="borderless" type="tertiary">
                {#snippet icon()}<IconEyeOpened />{/snippet}
            </Button>
            <Button aria-label="下载" size="small" theme="borderless" type="tertiary">
                {#snippet icon()}<IconDownload />{/snippet}
            </Button>
            <Button aria-label="删除" size="small" theme="borderless" type="tertiary" onclick={() => onRemove()}>
                {#snippet icon()}<IconDelete />{/snippet}
            </Button>
        </div>
    {/snippet}
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传
    </Button>
</Upload>
