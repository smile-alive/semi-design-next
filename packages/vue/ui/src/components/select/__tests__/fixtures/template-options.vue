<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import Select, { SelectOption, type SelectHandle } from '../..';

    defineOptions({ inheritAttrs: false });
    const props = withDefaults(defineProps<{ items?: string[]; extra?: boolean }>(), {
        items: () => ['x', 'y'],
        extra: false,
    });
    const select = useTemplateRef<SelectHandle>('select');
    defineExpose({ select });
</script>

<template>
    <Select ref="select" :motion="false" v-bind="$attrs">
        <SelectOption disabled showTick value="on">On</SelectOption>
        <SelectOption :disabled="false" :showTick="false" value="off">Off</SelectOption>
        <template v-for="item in props.items" :key="item">
            <template v-if="item">
                <SelectOption :value="item">{{ item }}</SelectOption>
            </template>
        </template>
        <SelectOption v-if="props.extra" value="extra">Extra</SelectOption>
        <SelectOption value="markup"><b>Alpha</b></SelectOption>
    </Select>
</template>
