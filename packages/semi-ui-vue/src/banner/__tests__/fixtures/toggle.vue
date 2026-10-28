<script setup lang="ts">
    import { ref } from 'vue';
    import Banner from '../../banner.vue';

    const visible = ref(true);
</script>

<template>
    <button type="button" @click="visible = !visible">toggle</button>
    <Banner v-if="visible">
        <template #description>hello</template>
    </Banner>
</template>
