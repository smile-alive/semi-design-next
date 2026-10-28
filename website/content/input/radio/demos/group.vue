<script setup lang="ts">
    import { ref } from 'vue';
    import { Radio, RadioGroup, type RadioChangeEvent, type RadioValue } from '@fibrae/semi-ui-vue';

    const value = ref<RadioValue | undefined>(1);
    const onChange = (e: RadioChangeEvent) => console.log('radio checked', e.target.value);
</script>

<template>
    <RadioGroup v-model="value" aria-label="单选组合示例" name="demo-radio-group" @change="onChange">
        <Radio :value="1">A</Radio>
        <Radio :value="2">B</Radio>
        <Radio :value="3">C</Radio>
        <Radio :value="4">D</Radio>
    </RadioGroup>
</template>
