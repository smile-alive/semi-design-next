<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import { Step, default as Steps, type StepsType } from '../../index';

    defineProps<{ type?: StepsType }>();
    const emit = defineEmits<{ els: [steps: Element, step: Element] }>();
    const steps = useTemplateRef('steps');
    const step = useTemplateRef('step');
    onMounted(() => emit('els', steps.value?.$el, step.value?.$el));
</script>

<template>
    <Steps ref="steps" :type="type">
        <Step ref="step">
            <template #title>A</template>
        </Step>
        <Step>
            <template #title>B</template>
        </Step>
    </Steps>
</template>
