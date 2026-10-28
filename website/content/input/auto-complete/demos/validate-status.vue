<script setup lang="ts">
    import { AutoComplete } from '@fibrae/semi-ui-vue';
</script>

<template>
    <AutoComplete aria-label="Warning status" defaultValue="ies" validateStatus="warning" />
    <br />
    <br />
    <AutoComplete aria-label="Error status" defaultValue="ies" validateStatus="error" />
    <br />
    <br />
    <AutoComplete aria-label="Default status" defaultValue="ies" />
</template>
