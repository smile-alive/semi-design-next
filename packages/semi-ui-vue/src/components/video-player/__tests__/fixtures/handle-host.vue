<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import type { VideoPlayerHandle } from '../../interface';
    import VideoPlayer from '../../video-player.vue';

    const props = defineProps<{ onReady: (handle: VideoPlayerHandle, root: Element) => void }>();
    const player = useTemplateRef<VideoPlayerHandle & { $el: Element }>('player');
    onMounted(() => {
        const handle = player.value as VideoPlayerHandle & { $el: Element };
        props.onReady(handle, handle.$el);
    });
</script>

<template>
    <VideoPlayer ref="player" src="https://example.com/video.mp4" />
</template>
