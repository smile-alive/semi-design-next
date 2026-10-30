<script lang="ts">
    import { VideoPlayer } from '@fibrae/semi-ui-svelte';

    const src = '/assets/video/vchart-show-video.mp4';
    const poster = '/assets/poster2.jpeg';
</script>

<VideoPlayer height={630} {poster} {src} />
