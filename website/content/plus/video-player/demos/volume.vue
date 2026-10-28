<script setup lang="ts">
    import { VideoPlayer } from '@fibrae/semi-ui-vue';

    const src = '/assets/video/vchart-show-video.mp4';
    const poster = '/assets/poster2.jpeg';
</script>

<template>
    <VideoPlayer :height="630" muted :poster="poster" :src="src" />
</template>
