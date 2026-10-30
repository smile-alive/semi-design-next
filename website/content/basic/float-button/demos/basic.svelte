<script lang="ts">
    import { IconAIEditLevel1 } from '@fibrae/semi-icons-svelte';
    import { FloatButton } from '@fibrae/semi-ui-svelte';

    const onclick = () => {
        console.log('float button clicked');
    };
</script>

<span>基本使用：页面右下第三列 1 </span>
<FloatButton aria-label="AI 编辑" style="bottom: 270px" {onclick}>
    {#snippet icon()}
        <IconAIEditLevel1 />
    {/snippet}
</FloatButton>
