<script lang="ts">
    import { cssClasses } from '@fibrae/semi-foundation/highlight/constants';
    import { findAll } from '@fibrae/semi-foundation/highlight/foundation';
    import '@fibrae/semi-foundation/highlight/highlight.scss';
    import useDefaultProps from '../_base/use-default-props.js';
    import type { HighlightProps, HighlightStyle } from './interface.js';

    const defaults = useDefaultProps('Highlight');

    // Undeclared attributes are dropped: the component has no root element
    const {
        sourceString = defaults('sourceString', ''),
        searchWords = defaults('searchWords', []),
        caseSensitive = defaults('caseSensitive', false),
        autoEscape = defaults('autoEscape', true),
        component = defaults('component', 'mark'),
        highlightClassName = defaults('highlightClassName'),
        highlightStyle = defaults('highlightStyle'),
    }: HighlightProps = $props();

    // plain-text chunks are never adjacent, so hydration cannot merge their text nodes
    const chunks = $derived(
        findAll({
            sourceString,
            searchWords: typeof searchWords === 'string' ? searchWords : searchWords.map((word) => (word && typeof word === 'object' ? { text: word.text, className: word.class, style: word.style } : word)),
            caseSensitive,
            autoEscape,
        }).map((chunk) => ({ ...chunk, text: sourceString.slice(chunk.start, chunk.end) }))
    );

    const toStyle = (...styles: (HighlightStyle | undefined)[]) =>
        styles
            .flatMap((style) => Object.entries(style ?? {}))
            .map(([key, value]) => `${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}: ${value};`)
            .join(' ') || undefined;
</script>

{#each chunks as chunk, index (index)}
    {#if chunk.highlight}
        <svelte:element this={component || 'mark'} class={[`${cssClasses.PREFIX}-tag`, highlightClassName, chunk.className]} style={toStyle(highlightStyle, chunk.style)}>{chunk.text}</svelte:element>
    {:else}
        {chunk.text}
    {/if}
{/each}
