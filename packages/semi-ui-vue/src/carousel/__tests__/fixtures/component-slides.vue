<script setup lang="ts">
    import Carousel from '../..';
    import Slide from './slide.vue';
</script>

<template>
    <Carousel :autoPlay="false">
        <Slide v-for="label in ['one', 'two']" :key="label" class="mine" :label="label" />
    </Carousel>
</template>
