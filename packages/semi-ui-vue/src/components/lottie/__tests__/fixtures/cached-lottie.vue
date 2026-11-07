<script setup lang="ts">
    import Lottie from '../../lottie.vue';

    // A Lottie inside KeepAlive, swapped out for another page while `active` is false.
    const props = defineProps<{ active: boolean }>();
</script>

<template>
    <KeepAlive>
        <Lottie v-if="props.active" :params="{ path: 'a.json' }" />
        <p v-else>other page</p>
    </KeepAlive>
</template>
