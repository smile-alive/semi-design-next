<script setup lang="ts">
    import { IconPlus } from '@fibrae/semi-icons-vue';
    import { Avatar } from '@fibrae/semi-ui-vue';
</script>

<template>
    <Avatar alt="漂亮的猫咪" :border="{ color: '#FE2C55', motion: true }" :bottomSlot="{ shape: 'circle', bgColor: '#FE2C55' }" contentMotion size="large" src="/assets/placeholder/avatar-a.svg" :style="{ margin: '4px' }" :topSlot="{ gradientStart: 'rgb(255,23,100)', gradientEnd: 'rgb(237,52,148)' }">
        <template #topSlotText>直播</template>
        <template #bottomSlotText>
            <IconPlus />
        </template>
    </Avatar>
</template>
