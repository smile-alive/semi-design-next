<script lang="ts">
    import { IconFile, IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Image, Upload, type FileItem } from '@fibrae/semi-ui-svelte';

    const url = '/assets/root-web-sites/edit-bag.jpeg';
    const fileList: FileItem[] = [
        { uid: '1', name: 'dyBag.png', status: 'success', size: '130KB', url },
        { uid: '2', name: 'dyBag2.png', status: 'success', size: '130KB', url },
    ];
</script>

<Upload action="https://api.semi.design/upload" {fileList}>
    {#snippet previewFile({ file })}
        {#if file.uid === '1'}
            <IconFile size="large" />
        {:else}
            <Image alt="" src={file.url} />
        {/if}
    {/snippet}
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传
    </Button>
</Upload>
