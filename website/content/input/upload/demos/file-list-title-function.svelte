<script lang="ts">
    import { IconClose, IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type FileItem } from '@fibrae/semi-ui-svelte';

    const action = 'https://api.semi.design/upload';

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

<Upload {action} fileList={initialList()} style="margin-bottom: 20px">
    {#snippet fileListHeader({ fileList, onClear, clearText })}
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%">
            <span style="color: var(--semi-color-primary)">📂 共 {fileList.length} 个文件</span>
            <Button size="small" type="danger" onclick={onClear}>
                {#snippet icon()}<IconClose />{/snippet}
                {clearText}
            </Button>
        </div>
    {/snippet}
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        自定义清空按钮样式
    </Button>
</Upload>
<Upload {action} fileList={initialList()}>
    {#snippet fileListHeader({ fileList, onClear })}
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%">
            <span>
                已选择
                <strong style="color: var(--semi-color-danger)">{fileList.length}</strong>
                个文件
            </span>
            <button style="padding: 0; border: none; background: none; font: inherit; cursor: pointer; color: var(--semi-color-link); font-size: 12px" type="button" onclick={onClear}>全部移除</button>
        </div>
    {/snippet}
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        完全自定义标题区域
    </Button>
</Upload>
