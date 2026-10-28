<script setup lang="ts">
    import { ref } from 'vue';
    import { Select, VideoPlayer } from '@fibrae/semi-ui-vue';

    const seekTime = ref<number | undefined>(5);

    const src = '/assets/video/vchart-show-video.mp4';
    const poster = '/assets/poster2.jpeg';
    const optionList = [
        { label: '5s', value: 5 },
        { label: '10s', value: 10 },
        { label: '15s', value: 15 },
    ];
</script>

<template>
    <div>
        <div>
            <span :style="{ marginBottom: '10px' }">请选择快进快退时间</span>
            <Select v-model="seekTime" aria-label="请选择快进快退时间" :optionList="optionList" placeholder="请选择快进快退时间" :style="{ width: '100px', marginLeft: '10px' }" />
        </div>
        <VideoPlayer :height="630" :poster="poster" :seekTime="seekTime" :src="src" :style="{ marginTop: '10px' }" />
    </div>
</template>
