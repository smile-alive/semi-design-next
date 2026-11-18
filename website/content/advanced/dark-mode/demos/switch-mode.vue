<script setup lang="ts">
    import { Button } from '@fibrae/semi-ui-vue';

    const switchMode = () => {
        const root = document.documentElement;
        if (root.hasAttribute('theme-mode')) {
            root.removeAttribute('theme-mode');
        } else {
            root.setAttribute('theme-mode', 'dark');
        }
    };
</script>

<template>
    <Button @click="switchMode">Switch Mode</Button>
</template>
