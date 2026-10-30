<script lang="ts" module>
    export type TriggerContentField = 'select' | 'cascader' | 'treeSelect' | 'autoComplete' | 'datePicker' | 'timePicker';
</script>

<script lang="ts">
    import FormAutoComplete from '../form-auto-complete.svelte';
    import FormCascader from '../form-cascader.svelte';
    import FormDatePicker from '../form-date-picker.svelte';
    import FormSelect from '../form-select.svelte';
    import FormTimePicker from '../form-time-picker.svelte';
    import FormTreeSelect from '../form-tree-select.svelte';
    import Form from '../form.svelte';

    let { type, labelPosition }: { type: TriggerContentField; labelPosition?: 'top' | 'left' | 'inset' } = $props();

    const treeData = [{ label: 'A', value: 'a', key: 'a' }];
</script>

{#snippet triggerContent()}
    <span data-testid="custom-trigger">custom</span>
{/snippet}

<Form {labelPosition}>
    {#if type === 'select'}
        <FormSelect field="f" label="F" optionList={treeData} {triggerContent} />
    {:else if type === 'cascader'}
        <FormCascader field="f" label="F" {treeData} {triggerContent} />
    {:else if type === 'treeSelect'}
        <FormTreeSelect field="f" label="F" {treeData} {triggerContent} />
    {:else if type === 'autoComplete'}
        <FormAutoComplete field="f" label="F" {triggerContent} />
    {:else if type === 'datePicker'}
        <FormDatePicker field="f" label="F" {triggerContent} />
    {:else}
        <FormTimePicker field="f" label="F" {triggerContent} />
    {/if}
</Form>
