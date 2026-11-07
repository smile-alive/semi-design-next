<script lang="ts">
    import { IconSetting } from '@fibrae/semi-icons-svelte';
    import { Typography, TypographyText } from '../index';

    interface Props {
        mode: 'copyAction' | 'copyIcon' | 'copySuccessTip' | 'icon' | 'inherit' | 'ellipsisTooltip' | 'root';
        labeled?: boolean;
        tip?: 'icon' | 'label' | 'text';
        size?: 'normal' | 'small';
    }

    const { mode, labeled = false, tip = 'text', size = 'normal' }: Props = $props();
</script>

{#if mode === 'copyAction'}
    <TypographyText copyable={{ content: 'code' }}>
        Key: code
        {#snippet copyAction({ copied, copy, config })}
            <button class="test-copy-button" onclick={copy}><span class="test-copied">{String(copied)}</span><span class="test-copy-content">{config.content}</span></button>
        {/snippet}
    </TypographyText>
{:else if mode === 'copyIcon'}
    <TypographyText copyable>
        Semi Design
        {#snippet copyIcon()}
            {#if labeled}<IconSetting aria-label="Copy code" />{:else}<IconSetting />{/if}
        {/snippet}
    </TypographyText>
{:else if mode === 'copySuccessTip'}
    <TypographyText copyable>
        Semi Design
        {#snippet copySuccessTip()}
            {#if tip === 'icon'}<IconSetting />{:else if tip === 'label'}<IconSetting aria-label="Done" />{:else}<em class="test-done">Done</em>{/if}
        {/snippet}
    </TypographyText>
{:else if mode === 'icon'}
    <TypographyText {size}>
        Settings
        {#snippet icon()}
            <IconSetting />
        {/snippet}
    </TypographyText>
{:else if mode === 'inherit'}
    <TypographyText class="outer" size="small">
        <TypographyText class="middle" size="inherit">
            <TypographyText class="inner" size="inherit">Semi</TypographyText>
        </TypographyText>
    </TypographyText>
{:else if mode === 'ellipsisTooltip'}
    <TypographyText ellipsis={{ pos: 'middle', showTooltip: true }} style="line-height: 20px">
        abcdefghijklmnopqrstuvwxyz
        {#snippet ellipsisTooltip({ content, trigger })}
            <div class="test-popup" data-content={content}>{@render trigger()}</div>
        {/snippet}
    </TypographyText>
{:else}
    <Typography class="root">Semi</Typography>
{/if}
