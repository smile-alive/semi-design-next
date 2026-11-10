<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type FileItem } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const action = '/upload';

    const initialList = (): FileItem[] => [
        {
            uid: '1',
            name: 'document.pdf',
            status: 'success',
            size: '130KB',
        },
        {
            uid: '2',
            name: 'report.xlsx',
            status: 'success',
            size: '222KB',
        },
    ];
</script>

<Upload {action} customRequest={mockUpload} fileList={initialList()} style="margin-bottom: 20px">
    {#snippet fileListTitle()}已上传文件{/snippet}
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        自定义标题文字
    </Button>
</Upload>
<Upload {action} customRequest={mockUpload} fileList={initialList()}>
    {#snippet fileListTitle()}
        <span style="color: var(--semi-color-primary); font-weight: 600">📁 重要文件</span>
    {/snippet}
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        带样式的标题
    </Button>
</Upload>
