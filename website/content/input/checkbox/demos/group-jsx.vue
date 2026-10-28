<script setup lang="ts">
    import { Checkbox, CheckboxGroup } from '@fibrae/semi-ui-vue';

    const values = ['A', 'B', 'C', 'D', 'E'];
</script>

<template>
    <CheckboxGroup aria-label="CheckboxGroup 示例" :defaultValue="['A', 'B']" :style="{ width: '100%' }">
        <Checkbox v-for="value in values" :key="value" :value="value">{{ value }}</Checkbox>
    </CheckboxGroup>
</template>
