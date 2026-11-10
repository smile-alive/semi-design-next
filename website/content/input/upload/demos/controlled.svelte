<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type FileItem, type UploadOnChangeProps } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const initList: FileItem[] = [
        {
            uid: '1',
            name: 'dyBag.jpeg',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
        {
            uid: '2',
            name: 'dy.jpeg',
            status: 'uploading',
            size: '222KB',
            percent: 50,
            preview: true,
            fileInstance: new File([new ArrayBuffer(2048)], 'dy.jpeg', { type: 'image/jpeg' }),
            url: '/assets/placeholder/avatar-a.svg',
        },
    ];

    let list = $state(initList);

    const onChange = ({ fileList, currentFile }: UploadOnChangeProps) => {
        console.log('onChange');
        console.log(fileList);
        console.log(currentFile);
    };
</script>

<Upload action="/upload" bind:fileList={list} customRequest={mockUpload} {onChange} showRetry={false}>
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传
    </Button>
</Upload>
