<script setup lang="ts">
    import { type VNode, Text } from 'vue';
    import type { KeyedNode } from '../_base/slot-nodes';
    import { elementChildren } from './slot-text';

    /**
     * Renders slot nodes, with the text of text nodes and elements formatted when `format` is given. Elements are rebuilt
     * from their tag and props because cached static nodes are shared across renders and must not be changed in place;
     * the scope id is copied so the user's scoped styles still apply.
     * shortcut: a rebuilt element loses its template ref and custom directives, and text inside components is not
     * formatted; format the default slot of component nodes when such content needs it.
     */
    // An explicit name makes the recursive <NumeralNodes> resolve to itself before a same-named component of the app
    defineOptions({ name: 'NumeralNodes' });
    const props = defineProps<{ nodes: KeyedNode[]; format?: (value: string) => string }>();

    const elementAttrs = (node: VNode) => ({ ...node.props, ...(node.scopeId && { [node.scopeId]: '' }) });
</script>

<template>
    <template v-for="[node, key] in props.nodes" :key="key">
        <template v-if="props.format && node.type === Text">{{ props.format(String(node.children)) }}</template>
        <component :is="node.type as string" v-else-if="props.format && typeof node.type === 'string'" v-bind="elementAttrs(node)">
            <template v-if="typeof node.children === 'string'">{{ props.format(node.children) }}</template>
            <NumeralNodes v-else :format="props.format" :nodes="elementChildren(node)" />
        </component>
        <component :is="node" v-else />
    </template>
</template>
