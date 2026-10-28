<script setup lang="ts">
    import { ref, useSlots } from 'vue';
    import DatePicker, { type DatePickerProps } from '../..';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<{ initValue?: DatePickerProps['modelValue'] }>();
    const value = ref(props.initValue);
    const slotNames = Object.keys(useSlots());
    defineExpose({ value });
</script>

<template>
    <DatePicker v-model="value" v-bind="$attrs">
        <template v-for="name in slotNames" :key="name" #[name]="scope">
            <slot :name="name" v-bind="scope ?? {}" />
        </template>
    </DatePicker>
</template>
