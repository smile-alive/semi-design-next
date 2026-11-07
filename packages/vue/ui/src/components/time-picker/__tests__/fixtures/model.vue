<script setup lang="ts">
    import { ref, useSlots } from 'vue';
    import TimePicker, { type TimePickerProps } from '../..';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<{ initValue?: TimePickerProps['modelValue'] } & /* @vue-ignore */ InstanceType<typeof TimePicker>['$props']>();
    const value = ref(props.initValue);
    const slotNames = Object.keys(useSlots());
    defineExpose({ value });
</script>

<template>
    <TimePicker v-model="value" v-bind="$attrs">
        <template v-for="name in slotNames" :key="name" #[name]="scope">
            <slot :name="name" v-bind="scope ?? {}" />
        </template>
    </TimePicker>
</template>
