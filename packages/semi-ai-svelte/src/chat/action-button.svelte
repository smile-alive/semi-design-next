<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/chat/constants';
    import { IconCopyStroked, IconLikeThumb, IconRedoStroked, IconThumbUpStroked } from '@fibrae/semi-icons-svelte';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';

    let { name, active, onClick }: { name: 'copy' | 'like' | 'dislike' | 'reset'; active: boolean; onClick: () => void } = $props();

    const locale = useLocale('Chat');

    const { PREFIX_CHAT_BOX_ACTION } = cssClasses;
    const label = $derived({ copy: locale().locale.copy, like: locale().locale.like, dislike: locale().locale.dislike, reset: locale().locale.regenerate }[name]);
</script>

<Button aria-label={label} aria-pressed={name === 'like' || name === 'dislike' ? active : undefined} class="{PREFIX_CHAT_BOX_ACTION}-btn" theme="borderless" type="tertiary" onclick={onClick}>
    {#snippet icon()}
        {#if name === 'copy'}
            <IconCopyStroked />
        {:else if name === 'reset'}
            <IconRedoStroked class="{PREFIX_CHAT_BOX_ACTION}-icon-redo" />
        {:else if active}
            <IconLikeThumb class={name === 'dislike' ? `${PREFIX_CHAT_BOX_ACTION}-icon-flip` : undefined} />
        {:else}
            <IconThumbUpStroked class={name === 'dislike' ? `${PREFIX_CHAT_BOX_ACTION}-icon-flip` : undefined} />
        {/if}
    {/snippet}
</Button>
