<script lang="ts">
    import type { SliderProps } from '../interface';
    import Slider from '../slider.svelte';

    let { props, vertical = false }: { props: SliderProps; vertical?: boolean } = $props();
</script>

<div style="position: relative; width: {vertical ? 200 : 500}px; height: 200px; overflow: auto">
    <Slider {...props} style={vertical ? 'height: 2000px' : 'width: 2000px'} {vertical} />
</div>
