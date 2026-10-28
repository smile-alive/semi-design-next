<script setup lang="ts">
    import { ref } from 'vue';
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-vue';
    import { Button, Progress } from '@fibrae/semi-ui-vue';

    const percent = ref(10);
    const strokeArr = [
        { percent: 20, color: 'red' },
        { percent: 40, color: 'orange-9' },
        { percent: 60, color: 'light-green-8' },
        { percent: 80, color: 'hsla(125, 50%, 46%, 1)' },
    ];
</script>

<template>
    <div>
        <Progress aria-label="disk usage" :percent="percent" showInfo :stroke="strokeArr" type="circle" :width="100" />
        <Progress aria-label="disk usage" :percent="percent" showInfo :stroke="strokeArr" :style="{ margin: '20px 0 10px' }" />
    </div>
    <Button aria-label="Decrease" :disabled="percent === 0" theme="light" @click="percent -= 10">
        <template #icon>
            <IconChevronLeft />
        </template>
    </Button>
    <Button aria-label="Increase" :disabled="percent === 100" theme="light" @click="percent += 10">
        <template #icon>
            <IconChevronRight />
        </template>
    </Button>
</template>
