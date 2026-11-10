<script setup lang="ts">
    import { ref } from 'vue';
    import { Select } from '@fibrae/semi-ui-vue';

    const optionList = [
        { value: 'video', label: '短视频' },
        { value: 'editing', label: '剪辑' },
    ];

    const value = ref<string | undefined>('video');
</script>

<template>
    <Select
        v-model="value"
        :optionList="optionList"
    />
</template>
