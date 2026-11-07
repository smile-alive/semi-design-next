<script setup lang="ts">
    import { ref } from 'vue';
    import type { UploadProps } from '../../interface';
    import Upload from '../../upload.vue';

    const props = defineProps<{ uploadProps?: Partial<UploadProps> }>();
    const active = ref(true);
</script>

<template>
    <button type="button" @click="active = !active">toggle</button>
    <KeepAlive>
        <Upload v-if="active" action="https://semi.bytendance.com" v-bind="props.uploadProps">
            <span>upload</span>
        </Upload>
        <p v-else>other page</p>
    </KeepAlive>
</template>
