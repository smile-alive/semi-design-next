<script setup lang="ts">
    import { Checkbox, type CheckboxEvent } from '@fibrae/semi-ui-vue';

    const onChange = (e: CheckboxEvent) => console.log(e);
</script>

<template>
    <Checkbox aria-label="Checkbox 示例" @change="onChange">Semi Design</Checkbox>
</template>
