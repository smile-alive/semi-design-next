<script setup lang="ts">
    import { ref } from 'vue';
    import { Button, Steps } from '@fibrae/semi-ui-vue';

    const steps = [
        { title: 'First', content: 'First-content' },
        { title: 'Second', content: 'Second-content' },
        { title: 'Last', content: 'Last-content' },
    ];
    const current = ref(0);
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
        <div class="steps-content" :style="{ marginTop: '4px', marginBottom: '4px' }">
            {{ steps[current].content }}
        </div>
        <div class="steps-action">
            <Button v-if="current < steps.length - 1" type="primary" @click="current += 1">Next</Button>
            <Button v-if="current === steps.length - 1" type="primary" @click="done">Done</Button>
            <Button v-if="current > 0" :style="{ marginLeft: '8px' }" @click="current -= 1">Previous</Button>
        </div>
    </div>
</template>
