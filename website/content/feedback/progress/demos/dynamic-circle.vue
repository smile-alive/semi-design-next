<script setup lang="ts">
    import { ref } from 'vue';
    import { IconChevronLeft, IconChevronRight } from '@fibrae/semi-icons-vue';
    import { Button, Progress } from '@fibrae/semi-ui-vue';

    const cirPerc = ref(40);
</script>

<template>
    <div>
        <div>
            <Progress aria-label="disk usage" :percent="cirPerc" type="circle" />
        </div>
        <Button aria-label="减少" :disabled="cirPerc === 0" theme="light" @click="cirPerc -= 10">
            <template #icon>
                <IconChevronLeft />
            </template>
        </Button>
        <Button aria-label="增加" :disabled="cirPerc >= 100" theme="light" @click="cirPerc += 10">
            <template #icon>
                <IconChevronRight />
            </template>
        </Button>
    </div>
</template>
