<script lang="ts">
    import { Select, VideoPlayer } from '@fibrae/semi-ui-svelte';

    let seekTime = $state<number | undefined>(5);

    const src = '/assets/video/vchart-show-video.mp4';
    const poster = '/assets/poster2.jpeg';
    const optionList = [
        { label: '5s', value: 5 },
        { label: '10s', value: 10 },
        { label: '15s', value: 15 },
    ];
</script>

<div>
    <div>
        <span style="margin-bottom: 10px">请选择快进快退时间</span>
        <Select aria-label="请选择快进快退时间" onChange={(value) => (seekTime = typeof value === 'number' ? value : undefined)} {optionList} placeholder="请选择快进快退时间" style="width: 100px; margin-left: 10px" value={seekTime} />
    </div>
    <VideoPlayer height={630} {poster} {seekTime} {src} style="margin-top: 10px" />
</div>
