<script setup lang="ts">
    import { Lottie } from '@fibrae/semi-ui-vue';

    const jsonURL = '/assets/root-web-sites/lottie-demo.json';
</script>

<template>
    <div>
        <Lottie height="300px" :params="{ path: jsonURL }" width="300px" />
    </div>
</template>
