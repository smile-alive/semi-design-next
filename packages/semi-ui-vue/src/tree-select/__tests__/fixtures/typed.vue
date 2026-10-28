<script setup lang="ts">
    import { ref } from 'vue';
    import TreeSelect from '../..';
    import type { TreeNodeData } from '../../../tree';

    // Type cases only: vue-tsc checks the template; no test mounts it
    type ChangeEvent = MouseEvent | KeyboardEvent | null;
    const data: TreeNodeData[] = [{ key: 'a', label: 'A', value: 'a' }];
    const one = ref<string>();
    const many = ref<string[]>([]);
    const node = ref<TreeNodeData>();
    const nodes = ref<TreeNodeData[]>([]);
    const onSingle = (_value: string | undefined) => undefined;
    const onMultiple = (_value: string[]) => undefined;
    const onNodes = (_nodes: TreeNodeData[], _event: ChangeEvent) => undefined;
</script>

<template>
    <TreeSelect v-model="one" :treeData="data" />
    <TreeSelect v-model="many" multiple :treeData="data" />
    <TreeSelect v-model="node" changeWithObject />
    <TreeSelect v-model="nodes" changeWithObject multiple />
    <!-- the template checks a handler passed by reference loosely, an inline call strictly -->
    <TreeSelect v-model="one" @change="(value, item, event) => [onSingle(value), item?.key, event]" />
    <TreeSelect v-model="many" multiple @change="(value, items, event) => [onMultiple(value), items.length, event]" />
    <TreeSelect v-model="nodes" changeWithObject multiple @change="(_value, items, event) => onNodes(items, event)" />
    <TreeSelect :modelValue="one" @expand="(keys, info) => [keys.length, info.expanded]" />
    <TreeSelect v-model="one">
        <template #selectedItem="{ item, index, onClose }">
            <button type="button" @click="onClose()">{{ item.label }}{{ index }}</button>
        </template>
    </TreeSelect>
    <!-- @vue-expect-error a single-mode handler on a multiple TreeSelect -->
    <TreeSelect v-model="many" multiple @change="onSingle($event)" />
    <!-- @vue-expect-error a multiple-mode handler on a single TreeSelect -->
    <TreeSelect v-model="one" @change="onMultiple($event)" />
    <!-- @vue-expect-error changeWithObject is a boolean -->
    <TreeSelect changeWithObject="yes" />
</template>
