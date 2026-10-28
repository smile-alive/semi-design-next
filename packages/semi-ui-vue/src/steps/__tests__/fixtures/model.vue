<script setup lang="ts">
    import { ref } from 'vue';
    import Steps, { type StepsType } from '../../index';

    const props = defineProps<{ type?: StepsType; initial?: number }>();
    const current = ref(props.initial ?? 0);
</script>

<template>
    <Steps v-model:current="current" :initial="props.initial" :type="props.type">
        <Steps.Step>
            <template #title>A</template>
        </Steps.Step>
        <Steps.Step>
            <template #title>B</template>
        </Steps.Step>
        <Steps.Step>
            <template #title>C</template>
        </Steps.Step>
    </Steps>
    <output aria-label="current">{{ current }}</output>
</template>
