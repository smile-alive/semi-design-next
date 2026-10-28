<script setup lang="ts">
    import { ref } from 'vue';
    import { IconUpload } from '@fibrae/semi-icons-vue';
    import { Button, Toast, Upload, type UploadOnChangeProps } from '@fibrae/semi-ui-vue';

    const limit = 2;
    // Only the trigger button is disabled; Upload itself stays enabled so files can still be removed.
    const disabled = ref(false);
    const onChange = (props: UploadOnChangeProps) => {
        disabled.value = props.fileList.length === limit;
    };
</script>

<template>
    <Upload action="https://api.semi.design/upload" :limit="limit" @change="onChange" @exceed="Toast.warning(`最多只允许上传${limit}个文件`)">
        <Button :disabled="disabled" theme="light">
            <template #icon>
                <IconUpload />
            </template>
            点击上传（最多{{ limit }}项）
        </Button>
    </Upload>
</template>
