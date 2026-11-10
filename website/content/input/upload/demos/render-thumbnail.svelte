<script lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-svelte';
    import { Image, Upload, type FileItem } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const action = '/upload';
    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'music.png',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/placeholder/avatar-b.svg',
        },
    ];
</script>

<Upload accept="image/*" {action} customRequest={mockUpload} fileList={defaultFileList} listType="picture" multiple>
    {#snippet thumbnail({ file })}
        <Image alt={file.name} src={file.url} />
    {/snippet}
    <IconPlus aria-label="Upload picture" size="extra-large" />
</Upload>
