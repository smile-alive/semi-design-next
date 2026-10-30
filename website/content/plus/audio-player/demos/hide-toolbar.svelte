<script lang="ts">
    import { AudioPlayer } from '@fibrae/semi-ui-svelte';

    const audioUrlObj = {
        src: '/assets/components/audio1.mp3',
        title: '音频标题',
    };
</script>

<div style="width: 100%">
    <AudioPlayer audioUrl={audioUrlObj} autoPlay={false} showToolbar={false} />
</div>
