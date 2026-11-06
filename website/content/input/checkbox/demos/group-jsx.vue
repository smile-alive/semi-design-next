<script setup lang="ts">
    import { Checkbox, CheckboxGroup } from '@fibrae/semi-ui-vue';
</script>

<template>
    <CheckboxGroup aria-label="CheckboxGroup 示例" :defaultValue="['A', 'B']" style="width: 100%">
        <Checkbox value="A">A</Checkbox>
        <Checkbox value="B">B</Checkbox>
        <Checkbox value="C">C</Checkbox>
        <Checkbox value="D">D</Checkbox>
        <Checkbox value="E">E</Checkbox>
    </CheckboxGroup>
</template>
