<script setup lang="ts">
    import { ref } from 'vue';
    import Carousel from '../..';

    const props = withDefaults(defineProps<{ activeIndex?: number }>(), { activeIndex: 1 });
    const changes = ref<[number, number][]>([]);
</script>

<template>
    <Carousel :activeIndex="props.activeIndex" :autoPlay="false" @change="(index, preIndex) => changes.push([index, preIndex])">
        <div v-for="n in 3" :key="n">
            <h3>index{{ n - 1 }}</h3>
        </div>
    </Carousel>
    <p>{{ JSON.stringify(changes) }}</p>
</template>
