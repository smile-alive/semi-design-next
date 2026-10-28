<script setup lang="ts">
    import { ref, watchEffect } from 'vue';
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-vue';
    import { Button, Progress, Space } from '@fibrae/semi-ui-vue';

    const percent = ref(65);
    const percentInterval = ref(0);
    const strokeArr = [
        { percent: 0, color: 'rgb(249, 57, 32)' },
        { percent: 50, color: '#46259E' },
        { percent: 100, color: 'hsla(125, 50%, 46%, 1)' },
    ];
    const strokeArrReverse = [
        { percent: 0, color: 'hsla(125, 50%, 46%, 1)' },
        { percent: 50, color: '#46259E' },
        { percent: 100, color: 'rgb(249, 57, 32)' },
    ];

    // Each value schedules the next one; restarting after 100 pauses longer.
    watchEffect((onCleanup) => {
        const current = percentInterval.value;
        const timer = setTimeout(
            () => {
                percentInterval.value = current > 100 ? 0 : current + 3;
            },
            current === 0 || current > 100 ? 1200 : 290 - (current % 50) * 3
        );
        onCleanup(() => clearTimeout(timer));
    });
</script>

<template>
    <Space :spacing="20">
        <div>
            <Progress aria-label="file download speed" :percent="percentInterval" showInfo :stroke="strokeArr" strokeGradient type="circle" :width="100" />
        </div>
        <div>
            <Progress aria-label="file download speed" :percent="percentInterval" showInfo :stroke="strokeArrReverse" strokeGradient type="circle" :width="100" />
        </div>
    </Space>
    <div :style="{ width: '100%', margin: '20px 0 10px' }">
        <Progress aria-label="file download speed" :percent="percent" showInfo size="large" :stroke="strokeArr" strokeGradient />
    </div>
    <Button aria-label="Decrease" :disabled="percent === 0" theme="light" @click="percent -= 5">
        <template #icon>
            <IconChevronLeft />
        </template>
    </Button>
    <Button aria-label="Increase" :disabled="percent === 100" theme="light" @click="percent += 5">
        <template #icon>
            <IconChevronRight />
        </template>
    </Button>
</template>
