<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type FileItem } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const action = '/upload';

    const fileList: FileItem[] = [
        {
            uid: '1',
            name: 'dyBag.jpeg',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
    ];
</script>

<Upload {action} customRequest={mockUpload} {fileList} showReplace>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传
    </Button>
</Upload>
