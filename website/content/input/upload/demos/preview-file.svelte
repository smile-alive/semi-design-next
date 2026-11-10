<script lang="ts">
    import { IconFile, IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Image, Upload, type FileItem } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'dyBag.png',
            status: 'success',
            size: '130KB',
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
        {
            uid: '2',
            name: 'dyBag2.png',
            status: 'success',
            size: '130KB',
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
    ];
</script>

<Upload action="/upload" customRequest={mockUpload} fileList={defaultFileList}>
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
