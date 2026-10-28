<script setup lang="ts">
    import { TextArea } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <TextArea aria-label="Text area" />
        <br />
        <br />
        <TextArea aria-label="Text area with character limit" :maxCount="100" showClear />
    </div>
</template>
