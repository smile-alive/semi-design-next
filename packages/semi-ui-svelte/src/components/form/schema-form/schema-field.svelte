<script lang="ts">
    import { untrack } from 'svelte';
    import { describeSchemaField, resolveJsonSchema } from '@fibrae/semi-foundation/components/form/json-schema';
    import warning from '@fibrae/semi-foundation/utils/warning';
    import useDefaultProps from '../../../base/use-default-props.js';
    import { getFormContext } from '../context.js';
    import type { SchemaFieldProps } from '../interface.js';
    import SchemaNode from './schema-node.svelte';

    const defaults = useDefaultProps('SchemaField');
    let { field = defaults('field', ''), jsonSchema = defaults('jsonSchema'), widgets = defaults('widgets'), renderField = defaults('renderField') }: SchemaFieldProps = $props();

    const form = getFormContext();

    if (!form) {
        throw new Error('[Semi Form] SchemaField must be used inside <Form>');
    }

    // exporting the Form schema walks all of it, so it runs again only when one of the two sources changes
    const root = $derived(resolveJsonSchema(jsonSchema, form.formProps.schema));
    const node = $derived(root && describeSchemaField(root, field));

    $effect(() => {
        const missing = !root;
        untrack(() => warning(missing, '[Semi Form] SchemaField has no JSON Schema to render: pass jsonSchema, or give the Form a schema that exports one'));
    });
</script>

{#if root && node}
    <SchemaNode {node} {renderField} {root} {widgets} />
{/if}
