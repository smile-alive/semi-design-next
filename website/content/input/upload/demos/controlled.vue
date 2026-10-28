<script setup lang="ts">
    import { ref } from 'vue';
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Upload, type FileItem, type UploadOnChangeProps } from '@fibrae/semi-ui-vue';

    const list = ref<FileItem[]>([
        {
            uid: '1',
            name: 'dyBag.jpeg',
            status: 'success',
            size: '130KB',
            preview: true,
            url: '/assets/root-web-sites/edit-bag.jpeg',
        },
        {
            uid: '2',
            name: 'dy.jpeg',
            status: 'uploading',
            size: '222KB',
            percent: 50,
            preview: true,
            fileInstance: new File([new ArrayBuffer(2048)], 'dy.jpeg', { type: 'image/jpeg' }),
            url: '/assets/placeholder/avatar-a.svg',
        },
    ]);

    const onChange = ({ fileList, currentFile }: UploadOnChangeProps) => {
        console.log('change', fileList, currentFile);
    };
</script>

<template>
    <Upload v-model:fileList="list" action="https://api.semi.design/upload" :showRetry="false" @change="onChange">
        <Button theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传
        </Button>
    </Upload>
</template>
