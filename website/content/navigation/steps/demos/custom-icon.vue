<script setup lang="ts">
    import { IconHome, IconLock } from '@fibrae/semi-icons-vue';
    import { Steps } from '@fibrae/semi-ui-vue';

    const log = (i: number) => console.log(i);
</script>

<template>
    <Steps type="basic" @change="log">
        <Steps.Step status="finish">
            <template #title>已完成</template>
        </Steps.Step>
        <Steps.Step status="error">
            <template #title>错误</template>
        </Steps.Step>
        <Steps.Step status="warning">
            <template #title>警告</template>
        </Steps.Step>
        <Steps.Step status="process">
            <template #title>正在进行</template>
            <template #icon>
                <IconHome size="extra-large" />
            </template>
        </Steps.Step>
        <Steps.Step status="wait">
            <template #title>等待</template>
            <template #icon>
                <IconLock size="extra-large" />
            </template>
        </Steps.Step>
    </Steps>
</template>
