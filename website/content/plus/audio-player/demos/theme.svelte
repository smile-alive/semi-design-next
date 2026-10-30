<script lang="ts">
    import { AudioPlayer } from '@fibrae/semi-ui-svelte';

    const audioUrlArrObj = [
        {
            src: '/assets/components/audio1.mp3',
            title: '音频标题1',
            cover: '/assets/root-web-sites/abstract.jpg',
        },
        {
            src: '/assets/components/audio2.mp3',
            title: '音频标题2',
            cover: '/assets/root-web-sites/abstract.jpg',
        },
    ];
</script>

<div style="width: 100%">
    <AudioPlayer audioUrl={audioUrlArrObj} theme="light" />
</div>
