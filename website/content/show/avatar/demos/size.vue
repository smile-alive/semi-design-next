<script setup lang="ts">
    import { Avatar } from '@fibrae/semi-ui-vue';

    const sizes = ['extra-extra-small', 'extra-small', 'small', 'default', 'medium', 'large', 'extra-large'];
</script>

<template>
    <div>
        <Avatar v-for="size in sizes" :key="size" alt="用户" :size="size" :style="{ margin: '4px' }">U</Avatar>
    </div>
</template>
