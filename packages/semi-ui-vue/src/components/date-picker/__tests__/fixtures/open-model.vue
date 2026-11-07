<script setup lang="ts">
    import { ref, useSlots } from 'vue';
    import DatePicker from '../..';

    defineOptions({ inheritAttrs: false });
    const props = defineProps<{ initOpen?: boolean }>();
    const open = ref(props.initOpen ?? false);
    const slotNames = Object.keys(useSlots());
    defineExpose({ open });
</script>

<template>
    <DatePicker v-model:open="open" v-bind="$attrs">
        <template v-for="name in slotNames" :key="name" #[name]="scope">
            <slot :name="name" v-bind="scope ?? {}" />
        </template>
    </DatePicker>
</template>
