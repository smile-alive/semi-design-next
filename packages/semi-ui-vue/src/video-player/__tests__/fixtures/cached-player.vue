<script setup lang="ts">
    import { ref } from 'vue';
    import VideoPlayer from '../../video-player.vue';

    const active = ref(true);
</script>

<template>
    <button type="button" @click="active = !active">toggle</button>
    <KeepAlive>
        <VideoPlayer v-if="active" src="https://example.com/video.mp4" />
    </KeepAlive>
</template>
