<script setup lang="ts">
    import { ref, useTemplateRef } from 'vue';
    import BackTop from '../../backtop.vue';

    const scroller = useTemplateRef('scroller');
    const clicks = ref(0);
</script>

<template>
    <div ref="scroller" data-testid="scroller" style="height: 200px; overflow: auto">
        <div style="height: 2000px" />
    </div>
    <BackTop aria-label="Back to top" :duration="100" :target="() => scroller" @click="clicks++" />
    <output aria-label="clicks">{{ clicks }}</output>
</template>
