<script setup lang="ts">
    import Carousel from '../..';

    withDefaults(defineProps<{ items?: string[]; showFirst?: boolean; showLast?: boolean }>(), {
        items: () => ['a', 'b'],
        showFirst: true,
        showLast: true,
    });
</script>

<template>
    <Carousel :autoPlay="false">
        ignored text
        <div v-if="showFirst" id="first">first</div>
        <template v-for="item in items" :key="item">
            <div>{{ item }}</div>
        </template>
        <template v-if="showLast">
            <div>last</div>
        </template>
    </Carousel>
</template>
