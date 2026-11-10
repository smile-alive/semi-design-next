<script setup lang="ts">
    import { TagInput } from '@fibrae/semi-ui-vue';
</script>

<template>
    <TagInput :defaultValue="['短视频', '直播', '长视频']" :maxTagCount="2" :restTagsPopoverProps="{ position: 'top' }" showRestTagsPopover @change="(v) => console.log(v)" />
</template>
