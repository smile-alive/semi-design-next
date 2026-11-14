<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/components/highlight/constants';
    import { findAll } from '@fibrae/semi-foundation/components/highlight/foundation';
    import '@fibrae/semi-foundation/components/highlight/highlight.scss';
    import { useDefaultProps } from '../../base/index.js';
    import type { HighlightProps, HighlightStyle } from './interface.js';

    const defaults = useDefaultProps('Highlight');

    // Undeclared attributes are dropped: the component has no root element
    const {
        sourceString = defaults('sourceString', ''),
        searchWords = defaults('searchWords', []),
        caseSensitive = defaults('caseSensitive', false),
        autoEscape = defaults('autoEscape', true),
        component = defaults('component', 'mark'),
        classNames = defaults('classNames'),
        styles = defaults('styles'),
    }: HighlightProps = $props();

    // plain-text chunks are never adjacent, so hydration cannot merge their text nodes
    const chunks = $derived(
        findAll({
            sourceString,
            searchWords,
            caseSensitive,
            autoEscape,
        })
    );

    const toStyle = (style: HighlightStyle | undefined) =>
        Object.entries(style ?? {})
            .map(([key, value]) => `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${value};`)
            .join(' ');
</script>

{#each chunks as chunk, index (index)}
    {#if chunk.highlight}
        <svelte:element this={component || 'mark'} class={[`${cssClasses.PREFIX}-tag`, classNames?.highlight, chunk.class]} style={[styles?.highlight, toStyle(chunk.style)].filter(Boolean).join('; ') || undefined}>{chunk.text}</svelte:element>
    {:else}
        {chunk.text}
    {/if}
{/each}
