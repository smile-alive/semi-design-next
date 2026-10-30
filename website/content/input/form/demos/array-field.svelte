<script lang="ts">
    import { IconMinusCircle, IconPlusCircle } from '@fibrae/semi-icons-svelte';
    import { ArrayField, Button, Form, FormInput, FormSelect, TextArea } from '@fibrae/semi-ui-svelte';

    const data = [
        { name: 'Semi D2C', role: 'Engineer' },
        { name: 'Semi C2D', role: 'Designer' },
    ];
    const roleOptions = [
        { label: 'Engineer', value: 'Engineer' },
        { label: 'Designer', value: 'Designer' },
    ];
</script>

{#snippet plus()}
    <IconPlusCircle />
{/snippet}

{#snippet minus()}
    <IconMinusCircle />
{/snippet}

<Form allowEmpty labelPosition="left" labelWidth="100px" style="width: 800px">
    {#snippet children({ formState })}
        <ArrayField field="rules" initValue={data}>
            {#snippet children({ arrayFields, onAdd, onAddWithInitValue })}
                <Button icon={plus} theme="light" onclick={onAdd}>Add new line</Button>
                <Button icon={plus} style="margin-left: 8px" onclick={() => onAddWithInitValue({ name: 'Semi DSM', role: 'Designer' })}>Add new line with init value</Button>
                {#each arrayFields as item (item.key)}
                    <div style="width: 1000px; display: flex">
                        <FormInput field={`${item.field}[name]`} label={`${item.field}.name`} style="width: 200px; margin-right: 16px" />
                        <FormSelect field={`${item.field}[role]`} label={`${item.field}.role`} optionList={roleOptions} style="width: 120px" />
                        <Button aria-label="Delete" icon={minus} style="margin: 12px" theme="borderless" type="danger" onclick={item.onRemove} />
                    </div>
                {/each}
            {/snippet}
        </ArrayField>
        <TextArea aria-label="Form state" style="margin-top: 10px" value={JSON.stringify(formState)} />
    {/snippet}
</Form>
