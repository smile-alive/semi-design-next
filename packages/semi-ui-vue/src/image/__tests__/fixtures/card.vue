<script setup lang="ts">
    import Image from '../../image.vue';

    const props = defineProps<{ src: string; alt: string }>();
</script>

<template>
    <figure>
        <Image :alt="props.alt" :src="props.src" />
    </figure>
</template>
