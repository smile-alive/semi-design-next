<script setup lang="ts">
    import { ref } from 'vue';
    import TimePicker from '../..';

    defineOptions({ inheritAttrs: false });
    defineProps</* @vue-ignore */ InstanceType<typeof TimePicker>['$props']>();
    const open = ref(true);
</script>

<template>
    <TimePicker v-model:open="open" v-bind="$attrs">
        <template #panelHeader>
            <strong>Select Time</strong>
        </template>
        <template #panelFooter>
            <button type="button" @click="open = false">close</button>
        </template>
    </TimePicker>
</template>
