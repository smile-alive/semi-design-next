<script setup lang="ts">
    import { AudioPlayer } from '@fibrae/semi-ui-vue';

    const audioUrlObj = {
        src: '/assets/components/audio1.mp3',
        title: '音频标题',
    };
</script>

<template>
    <div style="width: 100%">
        <AudioPlayer :audioUrl="audioUrlObj" :autoPlay="false" :showToolbar="false" />
    </div>
</template>
