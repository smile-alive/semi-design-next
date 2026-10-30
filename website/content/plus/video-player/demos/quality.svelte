<script lang="ts">
    import { VideoPlayer } from '@fibrae/semi-ui-svelte';

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

    let src = $state(playList[0].src);

    const onQualityChange = (quality: string) => {
        const source = playList.find((item) => item.quality === quality);
        if (source) src = source.src;
    };
</script>

<VideoPlayer defaultQuality="1080p" height={630} {onQualityChange} {poster} {qualityList} {src} />
