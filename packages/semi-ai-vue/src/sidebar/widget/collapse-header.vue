<script setup lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { IconCodeStroked, IconFile } from '@fibrae/semi-icons-vue';

    const props = defineProps<{ mode: 'code' | 'file'; name?: string }>();

    const collapseCls = cssClasses.COLLAPSE;
</script>

<template>
    <!-- Inside Collapse's toggle button: phrasing content only, no controls -->
    <span :class="`${collapseCls}-header-content`">
        <IconCodeStroked v-if="props.mode === 'code'" />
        <IconFile v-else />
        <span :class="`${collapseCls}-header-text`">{{ props.name }}</span>
    </span>
</template>
