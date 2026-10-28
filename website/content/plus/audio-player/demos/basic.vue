<script setup lang="ts">
    import { AudioPlayer } from '@fibrae/semi-ui-vue';

    const audioUrl = '/assets/components/audio2.mp3';
    const audioUrlArr = ['/assets/components/audio1.mp3', '/assets/components/audio2.mp3'];
    const audioUrlObj = {
        src: '/assets/components/audio1.mp3',
        title: '音频标题',
        cover: '/assets/root-web-sites/abstract.jpg',
    };
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
        <div style="margin-top: 10px">
            <AudioPlayer :audioUrl="audioUrl" :autoPlay="false" />
        </div>
        <div style="margin-top: 10px">
            <AudioPlayer :audioUrl="audioUrlObj" :autoPlay="false" />
        </div>
        <div style="margin-top: 10px">
            <AudioPlayer :audioUrl="audioUrlArr" :autoPlay="false" />
        </div>
        <div style="margin-top: 10px">
            <AudioPlayer :audioUrl="audioUrlArrObj" :autoPlay="false" />
        </div>
    </div>
</template>
