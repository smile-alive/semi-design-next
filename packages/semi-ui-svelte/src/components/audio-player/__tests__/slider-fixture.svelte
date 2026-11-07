<script lang="ts">
    import AudioSlider from '../audio-slider.svelte';
    import type { AudioSliderProps } from '../interface';

    let { store }: { store: { props: AudioSliderProps } } = $props();
</script>

<AudioSlider {...store.props} />
