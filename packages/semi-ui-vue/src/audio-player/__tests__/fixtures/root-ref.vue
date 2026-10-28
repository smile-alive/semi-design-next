<script setup lang="ts">
    import { onMounted, useTemplateRef } from 'vue';
    import AudioPlayer from '../../audio-player.vue';

    const props = defineProps<{ onReady: (root: Element) => void }>();
    const player = useTemplateRef('player');
    onMounted(() => props.onReady(player.value?.$el));
</script>

<template>
    <AudioPlayer ref="player" audioUrl="https://example.com/a.mp3" data-testid="player" />
</template>
