<script lang="ts">
    import { IconAIEditLevel1 } from '@fibrae/semi-icons-svelte';
    import { FloatButton } from '@fibrae/semi-ui-svelte';

    const onclick = () => {
        console.log('float button clicked');
    };
</script>

<span>方形：页面右下第三列 3</span>
<FloatButton aria-label="AI 编辑" shape="square" style="bottom: 150px" {onclick}>
    {#snippet icon()}
        <IconAIEditLevel1 />
    {/snippet}
</FloatButton>
