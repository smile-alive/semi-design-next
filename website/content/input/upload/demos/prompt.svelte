<script lang="ts">
    import { IconUpload } from '@fibrae/semi-icons-svelte';
    import { Button, Upload, type PromptPositionType } from '@fibrae/semi-ui-svelte';

    const action = 'https://api.semi.design/upload';
    const marginStyle: Partial<Record<PromptPositionType, string>> = {
        left: 'margin-right: 10px',
        right: 'margin-left: 10px',
    };
    const promptStyle = (pos: PromptPositionType) => `display: flex; align-items: center; color: var(--semi-color-text-2); height: 32px; ${marginStyle[pos] ?? ''}`;
    const positions: PromptPositionType[] = ['right', 'left', 'bottom'];
</script>

{#each positions as pos, index (pos)}
    {#if index}
        <div style="margin-bottom: 12px; margin-top: 12px; border-bottom: 1px solid var(--semi-color-border)"></div>
    {/if}
    <Upload {action} promptPosition={pos}>
        {#snippet prompt()}
            <div style={promptStyle(pos)}>请上传资格认证材料</div>
        {/snippet}
        <Button theme="light">
            {#snippet icon()}<IconUpload />{/snippet}
            点击上传
        </Button>
    </Upload>
{/each}
