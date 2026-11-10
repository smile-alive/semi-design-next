<script lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-svelte';
    import { Upload, type FileItem } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const defaultFileList: FileItem[] = [
        {
            uid: '1',
            name: 'music.png',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/placeholder/avatar-b.svg',
        },
        {
            uid: '2',
            name: 'brand.png',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/placeholder/avatar-b.svg',
        },
    ];
</script>

<Upload accept="image/*" action="/upload" customRequest={mockUpload} fileList={defaultFileList} listType="picture" multiple showPicInfo>
    <IconPlus aria-label="上传图片" size="extra-large" />
</Upload>
