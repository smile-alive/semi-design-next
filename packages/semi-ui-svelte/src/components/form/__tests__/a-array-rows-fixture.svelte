<script lang="ts" module>
    export interface ArrayRowsStore {
        field: string;
        formProps?: Record<string, unknown>;
        arrayInitValue?: unknown[];
        fieldProps?: Record<string, unknown>;
        withName?: boolean;
        showArray?: boolean;
        arrayKeepState?: boolean;
    }

    export const newLine = { name: 'yx', type: 'rd' };
</script>

<script lang="ts">
    import ArrayField from '../array-field.svelte';
    import FormInput from '../fields/form-input.svelte';
    import Form from '../form.svelte';
    import type { FormApi } from '../interface';

    let { store, onApi }: { store: ArrayRowsStore; onApi?: (api: FormApi) => void } = $props();
</script>

<Form {...store.formProps} getFormApi={onApi}>
    {#if store.withName}
        <FormInput field="name" noLabel />
    {/if}
    {#if store.showArray ?? true}
        <ArrayField field={store.field} initValue={store.arrayInitValue} keepState={store.arrayKeepState}>
            {#snippet children({ arrayFields, onAdd, onAddWithInitValue, onMove })}
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
                <button type="button" onclick={() => onMove(-3, 100)}>Move out of range</button>
                {#each arrayFields as { key, field, onRemove }, index (key)}
                    <div data-testid="row">
                        <FormInput field={`${field}[name]`} noLabel {...store.fieldProps} />
                        <FormInput field={`${field}[type]`} noLabel {...store.fieldProps} />
                        <button type="button" onclick={onRemove}>Remove</button>
                        <button type="button" onclick={() => onMove(index, index + 1)}>Move down</button>
                        <button type="button" onclick={() => onMove(index, index)}>Stay</button>
                    </div>
                {/each}
            {/snippet}
        </ArrayField>
    {/if}
</Form>
