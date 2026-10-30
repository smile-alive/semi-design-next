<script lang="ts">
    import type { SliderProps } from '../interface';
    import Slider from '../slider.svelte';

    let { store }: { store: { props: SliderProps } } = $props();
</script>

<Slider {...store.props} />
<button type="button">after</button>
