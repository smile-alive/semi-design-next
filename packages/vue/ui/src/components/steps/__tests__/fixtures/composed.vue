<script setup lang="ts">
    import { Step, default as Steps, type StepsType } from '../../index';

    const props = defineProps<{
        type?: StepsType;
        showSecond?: boolean;
        customIcon?: boolean;
        titles?: string[];
    }>();
</script>

<template>
    <Steps :current="1" :type="props.type">
        <Step>
            <template v-if="props.customIcon" #icon>
                <i class="my-icon" />
            </template>
            <template #title>A</template>
        </Step>
        <Step v-if="props.showSecond">
            <template #title>B</template>
        </Step>
        <span class="not-a-step">text</span>
        <Step v-for="title in props.titles" :key="title">
            <template #title>{{ title }}</template>
        </Step>
    </Steps>
</template>
