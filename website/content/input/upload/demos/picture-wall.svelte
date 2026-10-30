<script lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-svelte';
    import { Upload, type FileItem } from '@fibrae/semi-ui-svelte';

    const fileList: FileItem[] = [
        {
            uid: '1',
            name: 'dy.png',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/placeholder/avatar-a.svg',
        },
    ];
</script>

<Upload accept="image/*" action="https://api.semi.design/upload" {fileList} listType="picture" multiple>
    <IconPlus aria-label="上传图片" size="extra-large" />
</Upload>
