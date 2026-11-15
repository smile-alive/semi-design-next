<script lang="ts">
    import Form from '../form.svelte';
    import type { FormApi, SchemaArrayContext } from '../interface';
    import SchemaField from '../schema-form/schema-field.svelte';

    let { onApi }: { onApi: (api: FormApi) => void } = $props();

    const jsonSchema = {
        type: 'object',
        properties: { rows: { type: 'array', items: { type: 'object', required: ['tags'], properties: { tags: { type: 'array', items: { type: 'string' } } } } } },
    };
</script>

{#snippet array(context: SchemaArrayContext)}
    <button onclick={context.add}>add</button>
{/snippet}

<Form getFormApi={onApi} initValues={{ rows: [{ tags: ['a'] }] }}>
    <SchemaField {jsonSchema} renderers={{ array }} />
</Form>
