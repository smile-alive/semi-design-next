<script lang="ts">
    import ArrayField from '../array-field.svelte';
    import FormField from '../field.svelte';
    import FormInput from '../form-input.svelte';
    import ProbeControl from './probe-control.svelte';

    // An ArrayField of one `name` field per row, with buttons for the row operations
    let { field, initValue, rowInitValue, probe = false }: { field: string; initValue?: unknown[]; rowInitValue?: string; probe?: boolean } = $props();
</script>

<ArrayField {field} {initValue}>
    {#snippet children({ arrayFields, onAdd, onAddWithInitValue })}
        {#each arrayFields as row (row.key)}
            {#if probe}
                <FormField component={ProbeControl} field={`${row.field}.name`} />
            {:else}
                <FormInput field={`${row.field}.name`} initValue={rowInitValue} />
            {/if}
        {/each}
        <button type="button" onclick={() => onAdd(1)}>在第 1 行插入</button>
        <button type="button" onclick={() => arrayFields[0].onRemove()}>删除首行</button>
        <button type="button" onclick={() => onAddWithInitValue({ name: 'x' }, 1)}>在第 1 行插入 x</button>
    {/snippet}
</ArrayField>
