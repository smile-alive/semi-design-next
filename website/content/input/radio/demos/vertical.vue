<script setup lang="ts">
    import { Radio, RadioGroup } from '@fibrae/semi-ui-vue';
</script>

<template>
    <RadioGroup aria-label="单选组合示例" direction="vertical" name="demo-radio-group-vertical">
        <Radio :value="1">A</Radio>
        <Radio :value="2">B</Radio>
        <Radio :value="3">C</Radio>
        <Radio :value="4">D</Radio>
    </RadioGroup>
</template>
