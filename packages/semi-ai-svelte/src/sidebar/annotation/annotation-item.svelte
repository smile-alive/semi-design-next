<script lang="ts">
    import { cssClasses } from '@fibrae/semi-ai-foundation/sidebar/constants';
    import { formatTime } from '@fibrae/semi-foundation/video-player/utils';
    import { IconPlay } from '@fibrae/semi-icons-svelte';
    import type { AnnotationItem } from './interface.js';

    let { item, onClick }: { item: AnnotationItem; onClick?: (event: MouseEvent) => void } = $props();

    const prefix = cssClasses.ANNOTATION_ITEM;
</script>

<!-- Items are links, so the browser opens the url itself (middle click and copy link work too) -->
<!-- shortcut: an item without url is an anchor without href, activatable by pointer only; use a button when such
     items need keyboard access -->
{#snippet footer()}
    <div class={`${prefix}-footer`}>
        {#if item.logo}
            <img alt="" class={`${prefix}-footer-logo`} src={item.logo} />
        {/if}
        {#if item.type === 'video' || item.siteName}
            <span class={`${prefix}-footer-text`}>{item.siteName}</span>
        {/if}
        {#if typeof item.order === 'number'}
            <span class={`${prefix}-footer-order`}>{item.order}</span>
        {/if}
    </div>
{/snippet}

{#if item.type === 'video'}
    <a class={[prefix, `${prefix}-video`]} href={item.url} rel="noopener noreferrer" target="_blank" onclick={onClick}>
        <div class={`${prefix}-video-img-wrapper`}>
            {#if item.img}
                <img alt="" class={`${prefix}-video-img`} src={item.img} />
            {/if}
            <IconPlay class={`${prefix}-video-play`} />
            {#if typeof item.duration === 'number'}
                <span class={`${prefix}-video-duration`}>{formatTime(item.duration)}</span>
            {/if}
        </div>
        <div class={`${prefix}-video-content`}>
            <div class={`${prefix}-title`}>{item.title}</div>
            {@render footer()}
        </div>
    </a>
{:else}
    <a class={[prefix, `${prefix}-text`]} href={item.url} rel="noopener noreferrer" target="_blank" onclick={onClick}>
        <div class={`${prefix}-title`}>{item.title}</div>
        <div class={`${prefix}-text-detail`}>{item.detail}</div>
        {@render footer()}
    </a>
{/if}
