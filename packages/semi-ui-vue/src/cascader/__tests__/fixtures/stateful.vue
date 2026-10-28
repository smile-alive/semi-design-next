<script setup lang="ts">
    import { computed, ref, useSlots } from 'vue';
    import Cascader, { type CascaderData, type CascaderValue } from '../..';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<{
        initialValue?: CascaderValue;
        initialData: CascaderData[];
        multiple?: boolean;
        load?: (target: CascaderData, append: (children: CascaderData[]) => void) => Promise<void>;
        /** Mutates the loaded node in place instead of replacing treeData */
        inPlace?: boolean;
    }>();
    const value = ref<CascaderValue | undefined>(props.initialValue);
    const data = ref<CascaderData[]>(props.initialData);

    const withChildren = (list: CascaderData[], target: unknown, children: CascaderData[]): CascaderData[] =>
        list.map((node) => {
            if (node.value === target) return { ...node, children };
            return node.children ? { ...node, children: withChildren(node.children, target, children) } : node;
        });
    const find = (list: CascaderData[], target: unknown): CascaderData | undefined => {
        for (const node of list) {
            const found = node.value === target ? node : find(node.children ?? [], target);
            if (found) return found;
        }
        return undefined;
    };
    const loadData = computed(() => {
        const { load } = props;
        if (!load) return undefined;
        return (selected: CascaderData[]) => {
            const target = selected[selected.length - 1];
            return load(target, (children) => {
                if (!props.inPlace) {
                    data.value = withChildren(data.value, target.value, children);
                    return;
                }
                const node = find(data.value, target.value);
                if (node) node.children = children;
            });
        };
    });
    const slots = useSlots();
    const forwarded = computed(() => Object.keys(slots));
    defineExpose({ value, data });
</script>

<template>
    <Cascader v-model="value" :loadData="loadData" :motion="false" :multiple="props.multiple" :treeData="data" v-bind="$attrs">
        <template v-for="name in forwarded" :key="name" #[name]="scope">
            <slot :name="name" v-bind="scope ?? {}" />
        </template>
    </Cascader>
    <button type="button" @click="value = []">reset</button>
</template>
