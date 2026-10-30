<script setup lang="ts">
    import { ref } from 'vue';
    import { VideoPlayer } from '@fibrae/semi-ui-vue';

    const playList = [
        {
            src: '/assets/video/vchart-show-video.mp4',
            quality: '1080p',
        },
        {
            src: '/assets/video/vchart-show-video.mp4',
            quality: '480p',
        },
    ];
    const poster = '/assets/poster2.jpeg';
    const qualityList = [
        { label: '1080p', value: '1080p' },
        { label: '480p', value: '480p' },
    ];

    const src = ref(playList[0].src);

    const onQualityChange = (quality: string) => {
        console.log('quality change', quality);
        const source = playList.find((item) => item.quality === quality);
        if (source) src.value = source.src;
    };
</script>

<template>
    <VideoPlayer defaultQuality="1080p" :height="630" :poster="poster" :qualityList="qualityList" :src="src" @qualityChange="onQualityChange" />
</template>
