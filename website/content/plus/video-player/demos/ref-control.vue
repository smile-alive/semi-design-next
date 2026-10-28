<script setup lang="ts">
    import { useTemplateRef } from 'vue';
    import { Button, VideoPlayer } from '@fibrae/semi-ui-vue';

    const src = '/assets/video/vchart-show-video.mp4';
    const poster = '/assets/poster2.jpeg';

    const player1 = useTemplateRef('player1');
    const player2 = useTemplateRef('player2');

    function handlePlayAll() {
        void player1.value?.video?.play();
        void player2.value?.video?.play();
    }

    function handlePauseAll() {
        player1.value?.video?.pause();
        player2.value?.video?.pause();
    }
</script>

<template>
    <div>
        <div :style="{ marginBottom: '12px' }">
            <Button :style="{ marginRight: '8px' }" @click="handlePlayAll">同时播放</Button>
            <Button @click="handlePauseAll">同时暂停</Button>
        </div>
        <div :style="{ display: 'flex', gap: '12px' }">
            <VideoPlayer ref="player1" :height="315" :poster="poster" :src="src" width="50%" />
            <VideoPlayer ref="player2" :height="315" :poster="poster" :src="src" width="50%" />
        </div>
    </div>
</template>
