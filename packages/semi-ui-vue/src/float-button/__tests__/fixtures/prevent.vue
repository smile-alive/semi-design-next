<script setup lang="ts">
    import { ref } from 'vue';
    import FloatButton from '../../float-button.vue';

    const clicks = ref(0);
</script>

<template>
    <FloatButton aria-label="Anchor" href="#float-prevent" @click.prevent="clicks++" />
    <output aria-label="clicks">{{ clicks }}</output>
</template>
