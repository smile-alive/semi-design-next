<script setup lang="ts">
    import { ref } from 'vue';
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-vue';
    import { Button, Progress } from '@fibrae/semi-ui-vue';

    const percent = ref(40);
</script>

<template>
    <div>
        <Progress aria-label="disk usage" :percent="percent" showInfo />
        <Button aria-label="减少" :disabled="percent === 0" theme="light" @click="percent -= 10">
            <template #icon>
                <IconChevronLeft />
            </template>
        </Button>
        <Button aria-label="增加" :disabled="percent >= 100" theme="light" @click="percent += 10">
            <template #icon>
                <IconChevronRight />
            </template>
        </Button>
    </div>
</template>
