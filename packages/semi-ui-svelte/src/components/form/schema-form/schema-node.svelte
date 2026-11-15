<script lang="ts">
    import type { Snippet } from 'svelte';
    import { get } from 'es-toolkit/compat';
    import { isErrorLeaf } from '@fibrae/semi-foundation/components/form/errors';
    import { arrayState, blankRow, describeSchemaField, schemaFieldWarnings, type JsonSchema, type SchemaFieldNode } from '@fibrae/semi-foundation/components/form/json-schema';
    import { warning } from '@fibrae/semi-foundation/utils';
    import ArrayField from '../array-field.svelte';
    import { getFormContext } from '../context.js';
    import type { ArrayFieldSnippetProps, SchemaArrayContext, SchemaFieldContext, SchemaFieldProps, SchemaLeafContext, SchemaObjectContext } from '../interface.js';
    import SchemaNode from './schema-node.svelte';

    interface SchemaNodeProps extends Pick<SchemaFieldProps, 'renderers' | 'renderField'> {
        root: JsonSchema;
        node: SchemaFieldNode;
    }

    let { root, node, renderers, renderField }: SchemaNodeProps = $props();

    const form = getFormContext();

    if (!form) {
        throw new Error('[Semi Form] SchemaField must be used inside <Form>');
    }

    const rendererKind = $derived(node.kind === 'object' || node.kind === 'array' ? node.kind : 'field');
    const renderer = $derived((renderField?.[node.pattern] ?? renderers?.[rendererKind]) as Snippet<[SchemaFieldContext]> | undefined);
    const objectContext = $derived<SchemaObjectContext>({ kind: 'object', node, render, content });
    const leafContext = $derived<SchemaLeafContext>({ kind: 'field', node, render });

    // A getter reads the form state where the renderer uses it, so typing in a row does not rebuild the context
    const arrayContext = ({ arrayFields, onAdd, onAddWithInitValue, onMove }: ArrayFieldSnippetProps): SchemaArrayContext => {
        return {
            kind: 'array',
            node,
            render,
            ...arrayState(node, arrayFields.length),
            items: arrayFields.map(({ key, field, onRemove }, index) => ({
                key,
                field,
                index,
                node: describeSchemaField(root, field),
                get value() {
                    return get(form.formState.values, field);
                },
                remove: onRemove,
            })),
            add: (index) => {
                const row = blankRow(root, node.field);
                const at = typeof index === 'number' ? index : undefined;
                if (row === undefined) {
                    onAdd(at);
                } else {
                    onAddWithInitValue(row, at);
                }
            },
            addWithInitValue: onAddWithInitValue,
            move: onMove,
            get error() {
                const own = get(form.formState.errors, node.field);
                return isErrorLeaf(own) ? own : undefined;
            },
            fieldProps: { 'x-field-id': node.field },
        };
    };

    $effect(() => {
        warning(node.kind !== 'object' && !renderer, schemaFieldWarnings.noRenderer(node.field, rendererKind));
    });
</script>

{#snippet render(field: string)}
    <SchemaNode node={describeSchemaField(root, field)} {renderField} {renderers} {root} />
{/snippet}

{#snippet content()}
    {#each node.children as child (child.key)}
        <SchemaNode node={child} {renderField} {renderers} {root} />
    {/each}
{/snippet}

{#if node.kind === 'object'}
    {#if renderer}
        {@render renderer(objectContext)}
    {:else}
        {@render content()}
    {/if}
{:else if renderer}
    {#if node.kind === 'array'}
        <ArrayField field={node.field}>
            {#snippet children(rows)}
                {@const context = arrayContext(rows)}
                {@render renderer(context)}
            {/snippet}
        </ArrayField>
    {:else}
        {@render renderer(leafContext)}
    {/if}
{/if}
