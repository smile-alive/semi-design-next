<script setup lang="ts">
    import { Checkbox } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Checkbox aria-label="Checkbox 示例" :defaultChecked="false" disabled>Unchecked Disabled</Checkbox>
        <br />
        <Checkbox aria-label="Checkbox 示例" defaultChecked disabled>Checked Disabled</Checkbox>
    </div>
</template>
