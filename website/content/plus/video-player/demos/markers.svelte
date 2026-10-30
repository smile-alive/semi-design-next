<script lang="ts">
    import { VideoPlayer } from '@fibrae/semi-ui-svelte';

    const src = '/assets/video/vchart-show-video.mp4';
    const poster = '/assets/poster2.jpeg';
    const markers = [
        { start: 0, title: '片头' },
        { start: 4, title: '功能介绍' },
        { start: 38, title: 'Figma Plugin' },
        { start: 51, title: '片尾' },
    ];
</script>

<VideoPlayer height={630} {markers} {poster} {src} />
