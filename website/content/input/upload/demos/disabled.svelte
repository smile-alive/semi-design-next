<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type FileItem } from '@fibrae/semi-ui-svelte';

    const fileList: FileItem[] = [
        {
            uid: '1',
            name: 'first.png',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/placeholder/avatar-a.svg',
        },
        {
            uid: '2',
            name: 'second.png',
            status: 'validateFail',
            size: '222KB',
            preview: true,
            url: '/assets/placeholder/avatar-a.svg',
        },
    ];
</script>

<Upload action="https://api.semi.design/upload" disabled {fileList}>
    <Button disabled theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传
    </Button>
</Upload>
