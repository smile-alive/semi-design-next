<script lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-svelte';
    import { Image, Upload, type FileItem } from '@fibrae/semi-ui-svelte';

    const fileList: FileItem[] = [
        {
            uid: '1',
            name: 'image-1.jpg',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/root-web-sites/abstract.jpg',
        },
    ];
</script>

<Upload accept="image/*" action="https://api.semi.design/upload" {fileList} listType="picture" multiple picHeight={110} picWidth={200}>
    {#snippet thumbnail({ file })}
        <Image alt={file.name} height={110} src={file.url} width={200} />
    {/snippet}
    <IconPlus aria-label="上传图片" size="extra-large" style="margin: 4px" />
    点击添加图片
</Upload>
