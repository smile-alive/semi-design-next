<script setup lang="ts">
    import Carousel, { type ArrowProps } from '../..';

    const props = withDefaults(
        defineProps<{
            arrowProps?: ArrowProps;
            left?: 'default' | 'empty' | 'icon' | 'labelled' | 'nested' | 'text';
            right?: 'default' | 'mixed';
        }>(),
        { arrowProps: undefined, left: 'default', right: 'default' }
    );
</script>

<template>
    <Carousel :arrowProps="props.arrowProps" :autoPlay="false">
        <template v-if="props.left === 'text'" #leftArrow>Back</template>
        <template v-else-if="props.left === 'nested'" #leftArrow>
            <span>Back</span>
        </template>
        <template v-else-if="props.left === 'icon'" #leftArrow>
            <i />
        </template>
        <template v-else-if="props.left === 'labelled'" #leftArrow>
            <i aria-label="Back" />
        </template>
        <template v-else-if="props.left === 'empty'" #leftArrow />
        <template v-if="props.right === 'mixed'" #rightArrow>Forward <i /></template>
        <div v-for="n in 3" :key="n">
            <h3>index{{ n - 1 }}</h3>
        </div>
    </Carousel>
</template>
