<script setup lang="ts">
    import Button from '../../../button';
    import Upload from '../../upload.vue';

    const props = defineProps<{ disabled: boolean }>();
</script>

<template>
    <Upload action="https://semi.bytendance.com">
        <Button :disabled="props.disabled">点击上传</Button>
    </Upload>
</template>
