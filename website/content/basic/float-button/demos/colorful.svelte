<script lang="ts">
    import { IconAIEditLevel1 } from '@fibrae/semi-icons-svelte';
    import { FloatButton } from '@fibrae/semi-ui-svelte';
</script>

<span>多彩按钮：页面右下第一列</span>
<FloatButton aria-label="访问 Semi 官网" colorful href="https://semi.design" rel="noopener noreferrer" style="bottom: 110px; inset-inline-end: 150px" target="_blank">
    {#snippet icon()}
        <IconAIEditLevel1 />
    {/snippet}
</FloatButton>
