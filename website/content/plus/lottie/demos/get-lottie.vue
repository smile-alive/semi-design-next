<script setup lang="ts">
    import { onMounted } from 'vue';
    import { Lottie } from '@fibrae/semi-ui-vue';

    const jsonURL = '/assets/root-web-sites/lottie_demo.json';

    onMounted(() => {
        void Lottie.getLottie().then((lottie) => console.log('lottie', lottie));
    });
</script>

<template>
    <div>
        <Lottie height="300px" :params="{ path: jsonURL }" width="300px" @getLottie="(lottie) => console.log('lottie', lottie)" />
    </div>
</template>
