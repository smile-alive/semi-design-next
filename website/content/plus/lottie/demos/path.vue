<script setup lang="ts">
    import { Lottie } from '@fibrae/semi-ui-vue';

    const jsonURL = '/assets/root-web-sites/lottie_demo.json';
    const params = { path: jsonURL };
</script>

<template>
    <div>
        <Lottie height="300px" :params="params" width="300px" />
    </div>
</template>
