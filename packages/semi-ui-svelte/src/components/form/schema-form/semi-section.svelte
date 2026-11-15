<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';
    import { formatLocale } from '@fibrae/semi-foundation/locale';
    import useLocale from '../../locale/use-locale.svelte.js';
    import FormSection from '../section.svelte';

    let { node, children, ...rest }: { node: SchemaFieldNode; children: Snippet; 'x-field-id'?: string } = $props();

    const locale = useLocale('Form');
</script>

{#snippet text()}{node.title ?? formatLocale(locale().locale.item, { index: (node.item?.index ?? 0) + 1 })}{/snippet}

{#snippet extraText()}{node.description}{/snippet}

<!-- The root renders no Section: the Form already is its group -->
{#if node.field === ''}
    {@render children()}
{:else}
    <FormSection {...rest} extraText={node.description ? extraText : undefined} {text}>{@render children()}</FormSection>
{/if}
