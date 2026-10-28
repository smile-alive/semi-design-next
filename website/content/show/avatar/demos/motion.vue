<script setup lang="ts">
    import { Avatar } from '@fibrae/semi-ui-vue';

    const sizes = ['medium', 'large', 'extra-large'];
</script>

<template>
    <div>
        <Avatar v-for="size in sizes" :key="size" :border="{ motion: true }" color="amber" contentMotion :size="size" :style="{ marginRight: '8px' }">T</Avatar>
    </div>
</template>
