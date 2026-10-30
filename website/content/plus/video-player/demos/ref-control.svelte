<script lang="ts">
    import { Button, VideoPlayer } from '@fibrae/semi-ui-svelte';

    const src = '/assets/video/vchart-show-video.mp4';
    const poster = '/assets/poster2.jpeg';

    let player1 = $state<ReturnType<typeof VideoPlayer>>();
    let player2 = $state<ReturnType<typeof VideoPlayer>>();

    const handlePlayAll = () => {
        void player1?.getVideo()?.play();
        void player2?.getVideo()?.play();
    };

    const handlePauseAll = () => {
        player1?.getVideo()?.pause();
        player2?.getVideo()?.pause();
    };
</script>

<div>
    <div style="margin-bottom: 12px">
        <Button style="margin-right: 8px" onclick={handlePlayAll}>同时播放</Button>
        <Button onclick={handlePauseAll}>同时暂停</Button>
    </div>
    <div style="display: flex; gap: 12px">
        <VideoPlayer bind:this={player1} height={315} {poster} {src} width="50%" />
        <VideoPlayer bind:this={player2} height={315} {poster} {src} width="50%" />
    </div>
</div>
