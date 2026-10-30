<script lang="ts">
    import { IconAIEditLevel1 } from '@fibrae/semi-icons-svelte';
    import { FloatButton } from '@fibrae/semi-ui-svelte';

    const onclick = () => {
        console.log('float button clicked');
    };
</script>

<span>大尺寸：页面右下第三列 2</span>
<FloatButton aria-label="AI 编辑" size="large" style="bottom: 200px" {onclick}>
    {#snippet icon()}
        <IconAIEditLevel1 />
    {/snippet}
</FloatButton>
