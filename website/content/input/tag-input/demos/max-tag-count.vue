<script setup lang="ts">
    import { TagInput } from '@fibrae/semi-ui-vue';

    const defaultValue = ['抖音', '火山', '西瓜视频'];
    const restTagsPopoverProps = { position: 'top' } as const;
</script>

<template>
    <TagInput :defaultValue="defaultValue" :maxTagCount="2" :restTagsPopoverProps="restTagsPopoverProps" showRestTagsPopover @change="(v) => console.log(v)" />
</template>
