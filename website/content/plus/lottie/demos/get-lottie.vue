<script setup lang="ts">
    import { onMounted } from 'vue';
    import { Lottie, type LottieModule } from '@fibrae/semi-ui-vue';

    const jsonURL = '/assets/root-web-sites/lottie_demo.json';
    const params = { path: jsonURL };

    const onLottie = (lottie: LottieModule) => {
        console.log('lottie', lottie);
    };

    onMounted(() => {
        void Lottie.getLottie().then((lottie) => console.log('lottie', lottie));
    });
</script>

<template>
    <div>
        <Lottie height="300px" :params="params" width="300px" @getLottie="onLottie" />
    </div>
</template>
