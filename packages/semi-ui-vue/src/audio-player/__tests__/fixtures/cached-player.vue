<script setup lang="ts">
    import { ref } from 'vue';
    import AudioPlayer from '../../audio-player.vue';

    const active = ref(true);
</script>

<template>
    <button type="button" @click="active = !active">toggle</button>
    <KeepAlive>
        <AudioPlayer v-if="active" audioUrl="https://example.com/a.mp3" />
    </KeepAlive>
</template>
