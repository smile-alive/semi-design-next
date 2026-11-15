<script lang="ts">
    import Form from '../form.svelte';
    import type { FormApi, SchemaArrayContext, SchemaFieldContext } from '../interface';
    import SchemaField from '../schema-form/schema-field.svelte';
    import { semiRenderers } from '../schema-form/semi-renderers.svelte';

    let { onApi }: { onApi: (api: FormApi) => void } = $props();

    const jsonSchema = { type: 'object', properties: { contacts: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' } } } } } };

    let open = $state<string[]>([]);
</script>

{#snippet array(context: SchemaArrayContext)}
    <div {...context.fieldProps}>
        {#each context.items as item (item.key)}
            <section {...{ 'x-field-id': item.field }} aria-label={(item.value as { name: string }).name}>
                {#if open.includes(item.field)}{@render context.render(item.field)}{/if}
            </section>
        {/each}
    </div>
{/snippet}

{#snippet contact(context: SchemaFieldContext)}
    {#if context.kind === 'object'}{@render context.content()}{/if}
{/snippet}

<Form getFormApi={onApi} initValues={{ contacts: [{ name: 'Ann', email: 'a@x' }] }} onRevealField={(field) => (open = [...open, field.replace(/\].*/, ']')])}>
    <SchemaField {jsonSchema} renderField={{ 'contacts[]': contact }} renderers={{ ...semiRenderers, array }} />
</Form>
