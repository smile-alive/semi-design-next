<script setup lang="ts">
    import { Lottie, type LottieAnimation } from '@fibrae/semi-ui-vue';

    const jsonURL = '/assets/root-web-sites/lottie_demo.json';
    const params = { path: jsonURL };

    const onAnimation = (animation: LottieAnimation) => {
        console.log(animation);
    };
</script>

<template>
    <div>
        <Lottie height="300px" :params="params" width="300px" @getAnimationInstance="onAnimation" />
    </div>
</template>
