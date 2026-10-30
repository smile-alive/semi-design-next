<script lang="ts">
    import type { Component } from 'svelte';
    import { omitBy } from 'es-toolkit';
    import { type MarkdownChild, Fragment, isNode, voidTags } from './runtime.js';

    // The compiled tree is data, so the table component can render the cells it picks out of it with this same component.
    const { content }: { content: MarkdownChild } = $props();

    // the compiled `children` is a node tree, which would compete with the `children` snippet
    const withoutChildren = (props: Record<string, unknown>) => omitBy(props, (_, key) => key === 'children');

    // Svelte binds a listener by the lowercase event name (`onclick`), while MDX authors write `onClick`
    const elementProps = (props: Record<string, unknown>) =>
        Object.fromEntries(
            Object.entries(props)
                .filter(([key]) => key !== 'children')
                .map(([key, value]) => {
                    if (typeof value === 'function' && /^on[A-Z]/.test(key)) return [key.toLowerCase(), value];
                    if (key === 'style' && typeof value === 'object' && value !== null) {
                        const css = Object.entries(value).map(([name, item]) => `${name.startsWith('--') ? name : name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${item}`);
                        return [key, css.join(';')];
                    }
                    return [key, value];
                })
        );
</script>

{#snippet render(child: MarkdownChild)}
    {#if Array.isArray(child)}
        {#each child as item, index (index)}
            {@render render(item)}
        {/each}
    {:else if isNode(child)}
        {#if child.type === Fragment}
            {@render render(child.props.children as MarkdownChild)}
        {:else if typeof child.type === 'string'}
            {#if voidTags.has(child.type)}
                <svelte:element this={child.type} {...elementProps(child.props)} />
            {:else}
                <svelte:element this={child.type} {...elementProps(child.props)}>
                    {@render render(child.props.children as MarkdownChild)}
                </svelte:element>
            {/if}
        {:else}
            {@const Element = child.type as Component<any>}
            <!-- `node` is the compiled element: a component reads the source of its children there, which a children snippet hides -->
            {#if child.props.children === undefined}
                <Element {...child.props} node={child} />
            {:else}
                <Element {...withoutChildren(child.props)} node={child}>
                    {@render render(child.props.children as MarkdownChild)}
                </Element>
            {/if}
        {/if}
    {:else if typeof child === 'string' || typeof child === 'number'}
        {child}
    {/if}
{/snippet}

{@render render(content)}
