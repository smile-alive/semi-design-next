<script lang="ts">
    import { en_US } from '@fibrae/semi-ui-svelte/locale';
    import LocaleProvider from '../../locale/locale-provider.svelte';
    import Form from '../form.svelte';
    import type { SchemaFieldContext, SchemaLeafContext } from '../interface';
    import SchemaField from '../schema-form/schema-field.svelte';
    import { semiRenderers } from '../schema-form/semi-renderers.svelte';

    const jsonSchema = {
        type: 'object',
        properties: {
            email: { type: 'string', format: 'email' },
            note: { type: 'string' },
            hidden: { type: 'string' },
            items: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' } } } },
        },
    };
</script>

{#snippet field(context: SchemaLeafContext)}
    {#if context.node.format === 'email'}
        <span>email {context.node.field}</span>
    {:else}
        {@render semiRenderers.field(context)}
    {/if}
{/snippet}

{#snippet label(context: SchemaFieldContext)}
    <span>custom {context.node.field} {context.node.kind}</span>
{/snippet}

{#snippet hidden()}{/snippet}

<LocaleProvider locale={en_US}>
    <Form initValues={{ items: [{ label: 'x' }] }}>
        <SchemaField {jsonSchema} renderField={{ 'items[].label': label, hidden }} renderers={{ ...semiRenderers, field }} />
    </Form>
</LocaleProvider>
