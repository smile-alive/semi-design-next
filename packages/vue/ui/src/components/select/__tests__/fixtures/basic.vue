<script setup lang="ts">
    import { computed, useSlots, useTemplateRef } from 'vue';
    import Select, { SelectOption, type SelectHandle, type SelectOptionProps } from '../..';

    defineOptions({ inheritAttrs: false });
    const props = withDefaults(defineProps<{ list?: SelectOptionProps[] } & /* @vue-ignore */ Parameters<typeof Select>[0]>(), {
        list: () => [
            { value: 'abc', label: 'Abc' },
            { value: 'hotsoon', label: 'Hotsoon' },
            { value: 'pipixia', label: 'Pipixia' },
            { value: 'toutiao', label: 'TopBuzz' },
        ],
    });
    const slots = useSlots();
    const forwarded = computed(() => Object.keys(slots).filter((name) => name !== 'default'));
    const select = useTemplateRef<SelectHandle>('select');
    defineExpose({ select });
</script>

<template>
    <Select ref="select" :motion="false" v-bind="$attrs">
        <slot v-if="$slots.default" />
        <template v-else>
            <SelectOption v-for="item in props.list" :key="item.value" v-bind="item" />
        </template>
        <template v-for="name in forwarded" :key="name" #[name]="scope">
            <slot :name="name" v-bind="scope ?? {}" />
        </template>
    </Select>
</template>
