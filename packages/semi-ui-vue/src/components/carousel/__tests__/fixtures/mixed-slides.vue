<script setup lang="ts">
    import Carousel from '../..';

    const props = withDefaults(defineProps<{ items?: string[]; showFirst?: boolean; showLast?: boolean }>(), {
        items: () => ['a', 'b'],
        showFirst: true,
        showLast: true,
    });
</script>

<template>
    <Carousel :autoPlay="false">
        ignored text
        <div v-if="props.showFirst" id="first">first</div>
        <template v-for="item in props.items" :key="item">
            <div>{{ item }}</div>
        </template>
        <template v-if="props.showLast">
            <div>last</div>
        </template>
    </Carousel>
</template>
