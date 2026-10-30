<script lang="ts">
    import { IllustrationConstruction, IllustrationConstructionDark } from '@fibrae/semi-illustrations-svelte';
    import { Empty } from '@fibrae/semi-ui-svelte';

    const imageStyle = 'width: 150px; height: 150px';
</script>

{#snippet image()}<IllustrationConstruction style={imageStyle} />{/snippet}
{#snippet darkModeImage()}<IllustrationConstructionDark style={imageStyle} />{/snippet}

<Empty {darkModeImage} {image} title="功能建设中">
    {#snippet description()}当前功能暂未开放，敬请期待。{/snippet}
</Empty>
