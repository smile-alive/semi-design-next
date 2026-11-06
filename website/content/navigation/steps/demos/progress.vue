<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Steps } from '@fibrae/semi-ui-vue';

    const steps = [
        { title: 'First', content: 'First-content' },
        { title: 'Second', content: 'Second-content' },
        { title: 'Last', content: 'Last-content' },
    ];
    const current = ref(0);
    const next = () => {
        current.value += 1;
    };
    const prev = () => {
        current.value -= 1;
    };
    const log = (i: number) => console.log(i);
    const done = () => console.log('Processing complete!');
</script>

<template>
    <div>
        <Steps :current="current" type="basic" @change="log">
            <Steps.Step v-for="item in steps" :key="item.title">
                <template #title>{{ item.title }}</template>
            </Steps.Step>
        </Steps>
        <div class="steps-content" :style="{ marginBlockStart: '4px', marginBlockEnd: '4px' }">
            {{ steps[current].content }}
        </div>
        <div class="steps-action">
            <Button v-if="current < steps.length - 1" type="primary" @click="next">Next</Button>
            <Button v-if="current === steps.length - 1" type="primary" @click="done">Done</Button>
            <Button v-if="current > 0" :style="{ marginInlineStart: '8px' }" @click="prev">Previous</Button>
        </div>
    </div>
</template>
