<script setup lang="ts">
    import { Avatar } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Avatar color="amber" :topSlot="{ gradientStart: 'rgb(255,23,100)', gradientEnd: 'rgb(237,52,148)' }">
            T
            <template #topSlotText>直播</template>
        </Avatar>

        <Avatar color="amber" size="large" :topSlot="{ gradientStart: 'rgb(255,23,100)', gradientEnd: 'rgb(237,52,148)' }">
            T
            <template #topSlotText>直播</template>
        </Avatar>

        <Avatar color="amber" size="extra-large" :topSlot="{ gradientStart: 'rgb(255,23,100)', gradientEnd: 'rgb(237,52,148)' }">
            T
            <template #topSlotText>直播</template>
        </Avatar>
    </div>
</template>
