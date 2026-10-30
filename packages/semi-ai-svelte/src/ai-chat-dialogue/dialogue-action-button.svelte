<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/ai-chat-dialogue/constants';
    import { IconCopyStroked, IconEditStroked, IconLikeThumb, IconRedoStroked, IconShareStroked, IconThumbUpStroked } from '@fibrae/semi-icons-svelte';
    import Button from '@fibrae/semi-ui-svelte/button/button.svelte';
    import { useLocale } from '@fibrae/semi-ui-svelte/hooks';

    let { kind, active = false, onClick }: { kind: 'copy' | 'reset' | 'share' | 'edit' | 'like' | 'dislike'; active?: boolean; onClick: () => void } = $props();

    const locale = useLocale('AIChatDialogue');

    const { PREFIX_ACTION } = cssClasses;

    const LABELS = {
        copy: 'copy',
        reset: 'regenerate',
        share: 'share',
        edit: 'edit',
        like: 'like',
        dislike: 'dislike',
    } as const;

    const toggle = $derived(kind === 'like' || kind === 'dislike');
</script>

<Button aria-label={locale().locale[LABELS[kind]]} aria-pressed={toggle ? active : undefined} class="{PREFIX_ACTION}-btn" theme="borderless" type="tertiary" onclick={onClick}>
    {#snippet icon()}
        {#if kind === 'copy'}
            <IconCopyStroked />
        {:else if kind === 'reset'}
            <IconRedoStroked class="{PREFIX_ACTION}-icon-redo" />
        {:else if kind === 'share'}
            <IconShareStroked />
        {:else if kind === 'edit'}
            <IconEditStroked />
        {:else if active}
            <IconLikeThumb class={kind === 'dislike' ? `${PREFIX_ACTION}-icon-flip` : undefined} />
        {:else}
            <IconThumbUpStroked class={kind === 'dislike' ? `${PREFIX_ACTION}-icon-flip` : undefined} />
        {/if}
    {/snippet}
</Button>
