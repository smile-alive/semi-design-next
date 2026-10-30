<script lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-svelte';
    import { Radio, RadioGroup, Upload, type FileItem, type UploadProps } from '@fibrae/semi-ui-svelte';

    const action = 'https://api.semi.design/upload';
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
    let hotSpotLocation = $state<UploadProps['hotSpotLocation']>('end');
</script>

<RadioGroup aria-label="添加按钮位置" bind:value={hotSpotLocation} type="button">
    <Radio value="start">start</Radio>
    <Radio value="end">end</Radio>
</RadioGroup>
<hr />
<Upload accept="image/*" {action} {fileList} {hotSpotLocation} listType="picture" multiple onPreviewClick={handlePreview} showPicInfo>
    <IconPlus aria-label="上传图片" size="extra-large" />
</Upload>
