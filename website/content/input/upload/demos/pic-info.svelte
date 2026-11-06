<script lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-svelte';
    import { Upload, type FileItem } from '@fibrae/semi-ui-svelte';

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

<Upload accept="image/*" action="https://api.semi.design/upload" fileList={defaultFileList} listType="picture" multiple showPicInfo>
    <IconPlus aria-label="上传图片" size="extra-large" />
</Upload>
