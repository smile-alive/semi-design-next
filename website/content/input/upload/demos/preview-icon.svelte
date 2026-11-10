<script lang="ts">
    import { IconEyeOpened, IconPlus } from '@fibrae/semi-icons-svelte';
    import { Upload, type FileItem } from '@fibrae/semi-ui-svelte';
    import { mockUpload } from '#/lib/mock-upload';

    const defaultFileList: FileItem[] = [
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

<Upload accept="image/*" action="/upload" customRequest={mockUpload} fileList={defaultFileList} listType="picture" multiple onPreviewClick={handlePreview} showPicInfo>
    {#snippet picPreviewIcon()}
        <IconEyeOpened style="color: var(--semi-color-white); font-size: 24px" />
    {/snippet}
    <IconPlus aria-label="上传图片" size="extra-large" />
</Upload>
