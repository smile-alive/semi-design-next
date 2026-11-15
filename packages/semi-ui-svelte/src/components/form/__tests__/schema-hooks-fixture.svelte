<script lang="ts">
    import { en_US } from '@fibrae/semi-ui-svelte/locale';
    import LocaleProvider from '../../locale/locale-provider.svelte';
    import FormInput from '../fields/form-input.svelte';
    import Form from '../form.svelte';
    import type { FormApi, SchemaArrayContext, SchemaLeafContext, SchemaObjectContext } from '../interface';
    import SchemaField from '../schema-form/schema-field.svelte';

    let { onApi }: { onApi: (api: FormApi) => void } = $props();

    const jsonSchema = {
        type: 'object',
        properties: {
            profile: { type: 'object', description: 'Profile', properties: { name: { type: 'string' } } },
            body: { type: 'array', title: 'Body', description: 'Paragraphs', minItems: 1, maxItems: 2, items: { type: 'string', title: 'Para', description: 'One paragraph' } },
        },
    };

    const nodeInfo = ({ node }: SchemaObjectContext | SchemaLeafContext) => JSON.stringify({ depth: node.depth, description: node.description, item: node.item, title: node.title });
</script>

{#snippet object(context: SchemaObjectContext)}
    <div data-info={nodeInfo(context)} data-testid="object:{context.node.field}">{@render context.content()}</div>
{/snippet}

{#snippet array(context: SchemaArrayContext)}
    <div
        {...context.fieldProps}
        data-info={JSON.stringify({
            count: context.count,
            minItems: context.minItems,
            maxItems: context.maxItems,
            canAdd: context.canAdd,
            canRemove: context.canRemove,
            fixed: context.fixed,
            description: context.node.description,
            error: context.error,
            fieldProps: context.fieldProps,
            items: context.items.map(({ field, index, value }) => ({ field, index, value })),
        })}
        data-testid="array"
    >
        {#each context.items as item (item.key)}
            <div>{@render context.render(item.field)}</div>
        {/each}
        <button onclick={() => context.add()}>add</button>
    </div>
{/snippet}

{#snippet field(context: SchemaLeafContext)}
    <span data-info={nodeInfo(context)} data-testid="field:{context.node.field}"></span>
    <FormInput aria-label={context.node.field} field={context.node.field} noLabel />
{/snippet}

<LocaleProvider locale={en_US}>
    <Form getFormApi={onApi} initValues={{ body: ['p1'] }}>
        <SchemaField {jsonSchema} renderers={{ object, array, field }} />
    </Form>
</LocaleProvider>
