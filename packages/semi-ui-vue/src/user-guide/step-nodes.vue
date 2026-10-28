<script setup lang="ts">
    import type { KeyedNode } from '../_base/slot-nodes';

    defineProps<{ nodes: KeyedNode[]; fallback?: string }>();
</script>

<template>
    <template v-if="nodes.length">
        <template v-for="[node, key] in nodes" :key="key">
            <component :is="node" />
        </template>
    </template>
    <template v-else>{{ fallback }}</template>
</template>
