<script lang="ts">
    import { describeSchemaField, resolveJsonSchema, schemaFieldWarnings } from '@fibrae/semi-foundation/components/form/json-schema';
    import { warning } from '@fibrae/semi-foundation/utils';
    import { useDefaultProps } from '../../../base/index.js';
    import { getFormContext } from '../context.js';
    import type { SchemaFieldProps } from '../interface.js';
    import SchemaNode from './schema-node.svelte';

    const defaults = useDefaultProps('SchemaField');
    let { field = defaults('field', ''), jsonSchema = defaults('jsonSchema'), renderers = defaults('renderers'), renderField = defaults('renderField') }: SchemaFieldProps = $props();

    const form = getFormContext();

    if (!form) {
        throw new Error('[Semi Form] SchemaField must be used inside <Form>');
    }

    // exporting the Form schema walks all of it, so it runs again only when one of the two sources changes
    const root = $derived(resolveJsonSchema(jsonSchema, form.formProps.schema));
    const node = $derived(root && describeSchemaField(root, field));

    $effect(() => {
        warning(!root, schemaFieldWarnings.noSchema);
    });
</script>

{#if root && node}
    <SchemaNode {node} {renderField} {renderers} {root} />
{/if}
