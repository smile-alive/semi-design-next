<script setup lang="ts">
    import { Image } from '@fibrae/semi-ui-vue';

    const preview = {
        src: '/assets/root-web-sites/abstract-big.png',
    };
</script>

<template>
    <Image alt="Abstract colorful artwork" :height="200" :preview="preview" src="/assets/root-web-sites/abstract-small.jpeg" :width="300" />
</template>
