<script setup lang="ts">
    import { computed, ref } from 'vue';
    import Tree, { type TreeNodeData, type TreeValue } from '../..';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<{ initialValue?: TreeValue }>();
    const data = ref<TreeNodeData[]>([
        { label: 'Expand to load0', value: '0', key: '0' },
        { label: 'Expand to load1', value: '1', key: '1' },
        { label: 'Leaf Node', value: '2', key: '2', isLeaf: true },
    ]);
    const value = ref(props.initialValue);
    const loadData = (node?: TreeNodeData) => {
        if (node && !node.children) {
            const { key } = node;
            data.value = data.value.map((item) =>
                item.key === key
                    ? {
                          ...item,
                          children: [0, 1].map((i) => ({
                              label: `Child Node${key}-${i}`,
                              value: `${key}-${i}`,
                              key: `${key}-${i}`,
                          })),
                      }
                    : item
            );
        }
        return Promise.resolve();
    };
    const model = computed(() =>
        props.initialValue === undefined
            ? {}
            : {
                  modelValue: value.value,
                  'onUpdate:modelValue': (next: TreeValue) => {
                      value.value = next;
                  },
              }
    );
</script>

<template>
    <Tree :loadData="loadData" :motion="false" multiple :treeData="data" v-bind="{ ...model, ...$attrs }" />
</template>
