<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import Carousel from '../..';

    const activeIndex = ref(0);
    const carousel = useTemplateRef('carousel');
</script>

<template>
    <Carousel ref="carousel" v-model:activeIndex="activeIndex" :autoPlay="false">
        <div v-for="n in 3" :key="n">
            <h3>index{{ n - 1 }}</h3>
        </div>
    </Carousel>
    <p>{{ activeIndex }}</p>
    <button type="button" @click="carousel?.goTo(2)">goTo3</button>
    <button type="button" @click="carousel?.play()">play</button>
    <button type="button" @click="carousel?.stop()">stop</button>
</template>
