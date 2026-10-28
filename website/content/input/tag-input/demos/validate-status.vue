<script setup lang="ts">
    import { TagInput } from '@fibrae/semi-ui-vue';
</script>

<template>
    <TagInput placeholder="default" />
    <br />
    <br />
    <TagInput placeholder="warning" validateStatus="warning" />
    <br />
    <br />
    <TagInput placeholder="error" validateStatus="error" />
</template>
