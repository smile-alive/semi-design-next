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
    {#snippet children(form)}
        <ArrayField field="rules" initValue={data}>
            {#snippet children(arrayField)}
                <Button icon={plus} theme="light" onclick={arrayField.onAdd}>Add new line</Button>
                <Button icon={plus} style="margin-inline-start: 8px" onclick={() => arrayField.onAddWithInitValue({ name: 'Semi DSM', role: 'Designer' })}>Add new line with init value</Button>
                {#each arrayField.arrayFields as item (item.key)}
                    <div style="width: 1000px; display: flex">
                        <FormInput field={`${item.field}[name]`} label={`${item.field}.name`} style="width: 200px; margin-inline-end: 16px" />
                        <FormSelect field={`${item.field}[role]`} label={`${item.field}.role`} optionList={roleOptions} style="width: 120px" />
                        <Button aria-label="Delete" icon={minus} style="margin: 12px" theme="borderless" type="danger" onclick={item.onRemove} />
                    </div>
                {/each}
            {/snippet}
        </ArrayField>
        <TextArea aria-label="Form state" style="margin-block-start: 10px" value={JSON.stringify(form.formState)} />
    {/snippet}
</Form>
