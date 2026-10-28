<script setup lang="ts">
    import { IconEmoji, IconHome, IconSpin } from '@fibrae/semi-icons-vue';
</script>

<template>
    <div>
        <IconHome size="small" />
        <IconEmoji :rotate="180" />
        <IconSpin spin />
    </div>
</template>
