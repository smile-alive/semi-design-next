<script lang="ts" module>
    export interface ArrayRowsStore {
        /** The ArrayField's path; changing it renames the field */
        field: string;
        formProps?: Record<string, unknown>;
        arrayInitValue?: unknown[];
        /** Spread onto the name and type inputs of every row */
        fieldProps?: Record<string, unknown>;
        /** Adds a plain input outside the ArrayField */
        withName?: boolean;
    }

    export const newLine = { name: 'yx', type: 'rd' };
</script>

<script lang="ts">
    import ArrayField from '../array-field.svelte';
    import FormInput from '../form-input.svelte';
    import Form from '../form.svelte';
    import type { FormApi } from '../interface';

    let { store, onApi }: { store: ArrayRowsStore; onApi?: (api: FormApi) => void } = $props();
</script>

<Form {...store.formProps} getFormApi={onApi}>
    {#if store.withName}
        <FormInput field="name" noLabel />
    {/if}
    <ArrayField field={store.field} initValue={store.arrayInitValue}>
        {#snippet children({ arrayFields, onAdd, onAddWithInitValue })}
            <button type="button" onclick={onAdd}>Add Empty Line</button>
            <button type="button" onclick={() => onAddWithInitValue(newLine)}>Add line with setting value</button>
            <button
                type="button"
                onclick={() => {
                    onAdd();
                    onAdd();
                }}>Add two lines</button
            >
            <button type="button" onclick={() => onAddWithInitValue({ name: 'x' }, 0)}>Insert x at head</button>
            {#each arrayFields as { key, field, onRemove } (key)}
                <div data-testid="row">
                    <FormInput field={`${field}[name]`} noLabel {...store.fieldProps} />
                    <FormInput field={`${field}[type]`} noLabel {...store.fieldProps} />
                    <button type="button" onclick={onRemove}>Remove</button>
                </div>
            {/each}
        {/snippet}
    </ArrayField>
</Form>
