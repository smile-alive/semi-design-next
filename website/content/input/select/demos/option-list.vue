<script setup lang="ts">
    import { Select } from '@fibrae/semi-ui-vue';

    const list = [
        { value: 'video', label: '短视频', otherKey: 0 },
        { value: 'camera', label: '相机', disabled: true, otherKey: 1 },
        { value: 'editing', label: '剪辑', otherKey: 2 },
        { value: 'news', label: '资讯', otherKey: 3 },
    ];
</script>

<template>
    <Select aria-label="业务线" :optionList="list" placeholder="请选择业务线" style="width: 180px" />
</template>
