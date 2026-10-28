<script setup lang="ts">
    import { ref } from 'vue';
    import { TimePicker } from '@fibrae/semi-ui-vue';

    const value = ref<Date | (Date | undefined)[] | null | undefined>(null);
    const onChange = (time: unknown) => console.log(time);
</script>

<template>
    <TimePicker v-model="value" @change="onChange" />
</template>
