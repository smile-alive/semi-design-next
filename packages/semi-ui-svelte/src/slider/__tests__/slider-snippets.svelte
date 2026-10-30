<script lang="ts">
    import Slider from '../slider.svelte';

    let { tooltipOnMark = false }: { tooltipOnMark?: boolean } = $props();
</script>

{#snippet mark({ value, label }: { value: number; label: string | number })}
    <strong class="custom-mark">{label}@{value}</strong>
{/snippet}
{#snippet tip({ value, handle }: { value: string | number; handle: 'min' | 'max' })}
    <em class="custom-tip">{handle}:{value}</em>
{/snippet}

<Slider {mark} marks={{ 20: '20c', 40: '40c' }} range style="width: 100px; height: 32px" {tip} tipFormatter={(value) => `${value}%`} {tooltipOnMark} tooltipVisible value={[30, 60]} />
