<script lang="ts">
    import ConfigProvider from '../../config-provider/config-provider.svelte';
    import Carousel from '../carousel.svelte';
</script>

{#snippet slide({ item }: { item: number })}
    <h3>index{item}</h3>
{/snippet}

<ConfigProvider direction="rtl">
    <Carousel autoPlay={false} items={[0, 1, 2]} {slide} />
</ConfigProvider>
