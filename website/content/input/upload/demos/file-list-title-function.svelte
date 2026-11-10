<script lang="ts">
    import { IconClose, IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type FileItem } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const action = '/upload';

    const defaultFileList: FileItem[] = [
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

<Upload {action} customRequest={mockUpload} fileList={defaultFileList} style="margin-bottom: 20px">
    {#snippet fileListHeader(title)}
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%">
            <span style="color: var(--semi-color-primary)">📂 共 {title.fileList.length} 个文件</span>
            <Button size="small" type="danger" onclick={title.onClear}>
                {#snippet icon()}<IconClose />{/snippet}
                {title.clearText}
            </Button>
        </div>
    {/snippet}
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        自定义清空按钮样式
    </Button>
</Upload>
<Upload {action} customRequest={mockUpload} fileList={defaultFileList}>
    {#snippet fileListHeader(title)}
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%">
            <span>
                已选择
                <strong style="color: var(--semi-color-danger)">{title.fileList.length}</strong>
                个文件
            </span>
            <button style="padding: 0; border: none; background: none; font: inherit; cursor: pointer; color: var(--semi-color-link); font-size: 12px" type="button" onclick={title.onClear}>全部移除</button>
        </div>
    {/snippet}
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        完全自定义标题区域
    </Button>
</Upload>
