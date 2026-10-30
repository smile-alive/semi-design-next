<script lang="ts">
    import { IconEyeOpened, IconPlus } from '@fibrae/semi-icons-svelte';
    import { Upload, type FileItem } from '@fibrae/semi-ui-svelte';

    const fileList: FileItem[] = [
        {
            uid: '1',
            name: 'resso.png',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/placeholder/avatar-b.svg',
        },
    ];

    const handlePreview = (file: FileItem) => {
        window.open(file.url, 'imagePreview', 'width=300,height=300');
    };
</script>

<Upload accept="image/*" action="https://api.semi.design/upload" {fileList} listType="picture" multiple onPreviewClick={handlePreview} showPicInfo>
    {#snippet picPreviewIcon()}
        <IconEyeOpened style="color: var(--semi-color-white); font-size: 24px" />
    {/snippet}
    <IconPlus aria-label="上传图片" size="extra-large" />
</Upload>
