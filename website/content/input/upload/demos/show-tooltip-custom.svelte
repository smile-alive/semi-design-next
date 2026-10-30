<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Tooltip, Upload } from '@fibrae/semi-ui-svelte';
</script>

<Upload action="https://api.semi.design/upload" showTooltip>
    {#snippet ellipsisTooltip({ content: text, trigger })}
        <Tooltip position="bottom">
            {#snippet content()}{text}{/snippet}
            {@render trigger()}
        </Tooltip>
    {/snippet}
    <Button theme="light">
        {#snippet icon()}<IconUpload />{/snippet}
        点击上传
    </Button>
</Upload>
