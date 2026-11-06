<script lang="ts" generics="Values extends Record<string, any> = any, Output = Values">
    import useDefaultProps from '../_base/use-default-props.js';
    import Form from './form.svelte';
    import type { FormApi, SchemaFormProps } from './interface.js';
    import SchemaField from './schema-field.svelte';

    const defaults = useDefaultProps('SchemaForm');
    let { jsonSchema = defaults('jsonSchema'), widgets = defaults('widgets'), renderField = defaults('renderField'), children: content, ...rest }: SchemaFormProps<Values, Output> = $props();

    let form = $state.raw<{ getFormApi: () => FormApi<Values, Output> }>();

    export function getFormApi() {
        return form?.getFormApi();
    }
</script>

<Form bind:this={form} {...rest}>
    {#snippet children(renderProps)}
        <SchemaField {jsonSchema} {renderField} {widgets} />
        {@render content?.(renderProps)}
    {/snippet}
</Form>
