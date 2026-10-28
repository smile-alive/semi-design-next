<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import Select, { SelectOptGroup, SelectOption, type SelectHandle } from '../..';

    interface Group {
        label?: string;
        /** Renders the title through the `label` slot instead of the prop */
        labelSlot?: boolean;
        attrs?: Record<string, unknown>;
        options: string[];
    }

    defineOptions({ inheritAttrs: false });
    const props = withDefaults(defineProps<{ groups?: Group[] }>(), {
        groups: () => [{ label: 'Group1', options: ['a-1', 'a-2'] }, { label: 'Group2', options: ['b-1', 'b-2'] }, { options: ['c-1'] }],
    });
    const select = useTemplateRef<SelectHandle>('select');
    defineExpose({ select });
</script>

<template>
    <Select ref="select" :motion="false" v-bind="$attrs">
        <SelectOptGroup v-for="(group, i) in props.groups" :key="i" :label="group.labelSlot ? undefined : group.label" v-bind="group.attrs">
            <template v-if="group.labelSlot" #label>
                <div>{{ group.label }}</div>
            </template>
            <template #default>
                <SelectOption v-for="value in group.options" :key="value" :value="value">{{ value }}</SelectOption>
            </template>
        </SelectOptGroup>
    </Select>
</template>
