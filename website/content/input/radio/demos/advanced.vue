<script setup lang="ts">
    import { ref } from 'vue';
    import { Radio, type RadioChangeEvent } from '@fibrae/semi-ui-vue';

    const checked = ref(true);
    const onChange = (e: RadioChangeEvent) => console.log('radio checked', e.target.checked);
</script>

<template>
    <Radio v-model="checked" aria-label="单选示例" mode="advanced" name="demo-radio-advanced" @change="onChange"> 允许取消选择 </Radio>
</template>
