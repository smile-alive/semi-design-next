<script setup lang="ts">
    import { Button } from '@fibrae/semi-ui-vue';

    const switchMode = () => {
        const body = document.body;
        if (body.hasAttribute('theme-mode')) {
            body.removeAttribute('theme-mode');
        } else {
            body.setAttribute('theme-mode', 'dark');
        }
    };
</script>

<template>
    <Button @click="switchMode">Switch Mode</Button>
</template>
