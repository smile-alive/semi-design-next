<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import Select, { SelectOption, type SelectHandle } from '../..';

    defineOptions({ inheritAttrs: false });
    const props = withDefaults(defineProps<{ invalid?: boolean }>(), { invalid: false });
    const select = useTemplateRef<SelectHandle>('select');
    defineExpose({ select });
</script>

<template>
    <Select ref="select" :motion="false" v-bind="$attrs">
        <SelectOption v-if="false" value="x">X</SelectOption>
        <SelectOption value="a">A</SelectOption>
        <div v-if="props.invalid">Invalid</div>
        <template v-if="props.invalid">bare text</template>
        <SelectOption value="b">B</SelectOption>
    </Select>
</template>
