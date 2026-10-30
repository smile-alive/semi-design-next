<script lang="ts">
    import ArrayField from '../array-field.svelte';
    import FormInput from '../form-input.svelte';
    import Form from '../form.svelte';
    import type { FormApi } from '../interface';

    let { initValues = { tasks: [{ name: 'task-0' }, { name: 'task-1' }, { name: 'task-2' }] } }: { initValues?: Record<string, unknown> } = $props();

    let formApi: FormApi | undefined;
    let values = $state('');
</script>

<Form getFormApi={(api) => (formApi = api)} {initValues}>
    <ArrayField field="tasks">
        {#snippet children({ arrayFields, onAdd, onAddWithInitValue })}
            <button data-testid="add-default" type="button" onclick={() => onAdd()}>add()</button>
            <button data-testid="add-at-0" type="button" onclick={() => onAdd(0)}>add(0)</button>
            <button data-testid="add-at-1" type="button" onclick={() => onAdd(1)}>add(1)</button>
            <button data-testid="add-at-end" type="button" onclick={() => onAdd(arrayFields.length)}>add(end)</button>
            <button data-testid="add-out-of-range" type="button" onclick={() => onAdd(100)}>add(100)</button>
            <button data-testid="add-negative" type="button" onclick={() => onAdd(-5)}>add(-5)</button>
            <button data-testid="add-direct" type="button" onclick={onAdd}>add</button>
            <button data-testid="add-with-init-at-0" type="button" onclick={() => onAddWithInitValue({ name: 'inserted' }, 0)}>addWithInitValue(0)</button>
            <button data-testid="add-with-init-default" type="button" onclick={() => onAddWithInitValue({ name: 'appended' })}>addWithInitValue()</button>
            <button data-testid="get-values" type="button" onclick={() => (values = JSON.stringify(formApi?.getValue('tasks')))}>getValues</button>
            {#each arrayFields as item, index (item.key)}
                <div data-testid={`task-${index}`}>
                    <FormInput field={`${item.field}[name]`} noLabel />
                    <button type="button" onclick={item.onRemove}>remove</button>
                </div>
            {/each}
            <div data-testid="count">{arrayFields.length}</div>
        {/snippet}
    </ArrayField>
    <div data-testid="form-values">{values}</div>
</Form>
