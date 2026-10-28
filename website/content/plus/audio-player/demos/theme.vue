<script setup lang="ts">
    import { AudioPlayer } from '@fibrae/semi-ui-vue';

    const audioUrlArrObj = [
        {
            src: '/assets/components/audio1.mp3',
            title: '音频标题1',
            cover: '/assets/root-web-sites/abstract.jpg',
        },
        {
            src: '/assets/components/audio2.mp3',
            title: '音频标题2',
            cover: '/assets/root-web-sites/abstract.jpg',
        },
    ];
</script>

<template>
    <div style="width: 100%">
        <AudioPlayer :audioUrl="audioUrlArrObj" theme="light" />
    </div>
</template>
