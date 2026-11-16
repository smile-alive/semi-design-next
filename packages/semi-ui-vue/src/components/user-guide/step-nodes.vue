<script setup lang="ts">
    import type { KeyedNode } from '../../utils/index';

    const props = defineProps<{ nodes: KeyedNode[]; fallback?: string }>();
</script>

<template>
    <template v-if="props.nodes.length">
        <template v-for="[node, key] in props.nodes" :key="key">
            <component :is="node" />
        </template>
    </template>
    <template v-else>{{ props.fallback }}</template>
</template>
