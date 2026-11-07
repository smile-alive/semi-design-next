<script setup lang="ts">
    import Collapse from '../..';

    defineProps<{ disabled?: boolean; extra?: string; panelAttrs?: Record<string, unknown> }>();
</script>

<template>
    <Collapse>
        <template v-if="$slots.expandIcon" #expandIcon>
            <slot name="expandIcon" />
        </template>
        <template v-if="$slots.collapseIcon" #collapseIcon>
            <slot name="collapseIcon" />
        </template>
        <Collapse.Panel v-bind="panelAttrs" :disabled="disabled" itemKey="1">
            <template #header>This is panel header 1</template>
            <template v-if="extra !== undefined" #extra>{{ extra }}</template>
            <p>Hi, bytedance dance dance. This is the docsite of Semi UI.</p>
        </Collapse.Panel>
        <Collapse.Panel itemKey="2">
            <template #header>This is panel header 2</template>
            <p>Hi, bytedance dance dance. This is the docsite of Semi UI.</p>
        </Collapse.Panel>
        <Collapse.Panel itemKey="3">
            <template #header>This is panel header 3</template>
            <p>Hi, bytedance dance dance. This is the docsite of Semi UI.</p>
        </Collapse.Panel>
    </Collapse>
</template>
