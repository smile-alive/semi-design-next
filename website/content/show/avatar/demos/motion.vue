<script setup lang="ts">
    import { Avatar } from '@fibrae/semi-ui-vue';
</script>

<template>
    <div>
        <Avatar :border="{ motion: true }" color="amber" contentMotion :style="{ marginInlineEnd: '8px' }">T</Avatar>

        <Avatar :border="{ motion: true }" color="amber" contentMotion size="large" :style="{ marginInlineEnd: '8px' }">T</Avatar>

        <Avatar :border="{ motion: true }" color="amber" contentMotion size="extra-large" :style="{ marginInlineEnd: '8px' }">T</Avatar>
    </div>
</template>
