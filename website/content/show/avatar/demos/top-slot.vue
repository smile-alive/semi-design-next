<script setup lang="ts">
    import { Avatar } from '@fibrae/semi-ui-vue';

    const sizes = ['medium', 'large', 'extra-large'];
</script>

<template>
    <div>
        <Avatar v-for="size in sizes" :key="size" color="amber" :size="size" :topSlot="{ gradientStart: 'rgb(255,23,100)', gradientEnd: 'rgb(237,52,148)' }">
            T
            <template #topSlotText>直播</template>
        </Avatar>
    </div>
</template>
