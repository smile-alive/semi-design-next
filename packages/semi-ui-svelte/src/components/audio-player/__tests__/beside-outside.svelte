<script lang="ts">
    import AudioPlayer from '../audio-player.svelte';

    let { audioUrl }: { audioUrl: string } = $props();
</script>

<div style="display: flex">
    <AudioPlayer {audioUrl} />
    <div data-testid="outside" style="width: 200px; height: 100px"></div>
</div>
