<script setup lang="ts">
    import { ref } from 'vue';
    import { IconPlus } from '@fibrae/semi-icons-vue';
    import { Radio, RadioGroup, Upload, type FileItem, type UploadProps } from '@fibrae/semi-ui-vue';

    const action = 'https://api.semi.design/upload';
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
    const hotSpotLocation = ref<UploadProps['hotSpotLocation']>('end');
</script>

<template>
    <RadioGroup :modelValue="hotSpotLocation" type="button" @update:modelValue="hotSpotLocation = $event as UploadProps['hotSpotLocation']">
        <Radio value="start">start</Radio>
        <Radio value="end">end</Radio>
    </RadioGroup>
    <hr />
    <Upload accept="image/*" :action="action" :defaultFileList="defaultFileList" :hotSpotLocation="hotSpotLocation" listType="picture" multiple showPicInfo @previewClick="handlePreview">
        <IconPlus aria-label="上传图片" size="extra-large" />
    </Upload>
</template>
