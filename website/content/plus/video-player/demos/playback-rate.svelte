<script lang="ts">
    import { VideoPlayer } from '@fibrae/semi-ui-svelte';

    const playbackRateList = [
        { label: '0.5x', value: 0.5 },
        { label: '1.0x', value: 1 },
        { label: '1.5x', value: 1.5 },
        { label: '2.0x', value: 2 },
    ];
    const src = '/assets/video/vchart-show-video.mp4';
    const poster = '/assets/poster2.jpeg';
</script>

<VideoPlayer height={630} {playbackRateList} {poster} {src} />
