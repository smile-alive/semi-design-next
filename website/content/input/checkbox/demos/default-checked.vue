<script setup lang="ts">
    import { Checkbox } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Checkbox aria-label="Checkbox 示例" defaultChecked @change="(e) => console.log(e)">Semi Design</Checkbox>
</template>
