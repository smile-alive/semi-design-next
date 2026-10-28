<script setup lang="ts">
    import { ref } from 'vue';
    import { Steps } from '@fibrae/semi-ui-vue';

    const steps = [{ title: 'First' }, { title: 'Second' }, { title: 'Last' }];
    const current = ref(1);
</script>

<template>
    <div>
        <Steps v-model:current="current" type="basic">
            <Steps.Step v-for="item in steps" :key="item.title">
                <template #title>{{ item.title }}</template>
            </Steps.Step>
        </Steps>
    </div>
</template>
