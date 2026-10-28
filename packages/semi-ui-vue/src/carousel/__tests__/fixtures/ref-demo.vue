<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import Carousel from '../..';
    import Button from '../../../button';

    const props = withDefaults(defineProps<{ controlled?: boolean }>(), { controlled: false });
    const carousel = useTemplateRef('carousel');
    const activeIndex = ref(0);
    const labels = ['1', '2', '3', '4', '5'];
</script>

<template>
    <div>
        <Carousel v-if="props.controlled" ref="carousel" v-model:activeIndex="activeIndex" animation="slide" :style="{ width: '600px', height: '240px' }">
            <div v-for="label in labels" :key="label">
                <h3>{{ label }}</h3>
            </div>
        </Carousel>
        <Carousel v-else ref="carousel" animation="slide" :style="{ width: '600px', height: '240px' }">
            <div v-for="label in labels" :key="label">
                <h3>{{ label }}</h3>
            </div>
        </Carousel>
        <Button @click="carousel?.prev()">prev</Button>
        <Button @click="carousel?.next()">next</Button>
        <Button @click="carousel?.goTo(2)">goTo3</Button>
        <Button @click="carousel?.play()">play</Button>
        <Button @click="carousel?.stop()">stop</Button>
    </div>
</template>
