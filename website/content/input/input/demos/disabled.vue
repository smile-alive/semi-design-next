<script setup lang="ts">
    import { Input } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Input aria-label="可用的输入框" defaultValue="enabled input" />
    <br />
    <br />
    <Input aria-label="禁用的输入框" defaultValue="disabled input" disabled />
</template>
