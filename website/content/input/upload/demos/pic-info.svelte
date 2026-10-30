<script lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-svelte';
    import { Upload, type FileItem } from '@fibrae/semi-ui-svelte';

    const url = '/assets/placeholder/avatar-b.svg';
    const fileList: FileItem[] = [
        { uid: '1', name: 'music.png', status: 'success', size: '130KB', preview: true, url },
        { uid: '2', name: 'brand.png', status: 'success', size: '130KB', preview: true, url },
    ];
</script>

<Upload accept="image/*" action="https://api.semi.design/upload" {fileList} listType="picture" multiple showPicInfo>
    <IconPlus aria-label="上传图片" size="extra-large" />
</Upload>
